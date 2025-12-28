import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, mux-signature",
};

// Verify Mux webhook signature
async function verifyMuxSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Mux signature format: t=timestamp,v1=signature
    const parts = signature.split(",");
    const timestampPart = parts.find((p) => p.startsWith("t="));
    const signaturePart = parts.find((p) => p.startsWith("v1="));

    if (!timestampPart || !signaturePart) {
      console.error("Invalid signature format");
      return false;
    }

    const timestamp = timestampPart.slice(2);
    const expectedSignature = signaturePart.slice(3);

    // Check timestamp is not too old (5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const signatureTime = parseInt(timestamp, 10);
    if (now - signatureTime > 300) {
      console.error("Webhook signature too old");
      return false;
    }

    // Create the signed payload
    const signedPayload = `${timestamp}.${payload}`;

    // Generate HMAC SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload)
    );

    // Convert to hex
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedSignature === expectedSignature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const MUX_WEBHOOK_SECRET = Deno.env.get("MUX_WEBHOOK_SECRET");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get the raw body for signature verification
    const rawBody = await req.text();
    
    // Verify webhook signature if secret is configured
    if (MUX_WEBHOOK_SECRET) {
      const signature = req.headers.get("mux-signature");
      if (!signature) {
        console.error("Missing mux-signature header");
        return new Response(
          JSON.stringify({ error: "Missing signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isValid = await verifyMuxSignature(rawBody, signature, MUX_WEBHOOK_SECRET);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Webhook signature verified");
    } else {
      console.warn("MUX_WEBHOOK_SECRET not configured - skipping signature verification");
    }

    const body = JSON.parse(rawBody);
    console.log("Mux webhook received:", body.type);

    const { type, data } = body;

    if (type === "video.upload.asset_created") {
      const uploadId = data.id;
      const assetId = data.asset_id;

      console.log("Upload completed, asset created:", assetId, "for upload:", uploadId);

      const { error } = await supabase
        .from("diary_entries")
        .update({
          mux_asset_id: assetId,
          video_status: "processing",
        })
        .eq("mux_upload_id", uploadId);

      if (error) {
        console.error("Error updating entry:", error);
      }
    }

    if (type === "video.asset.ready") {
      const assetId = data.id;
      const playbackId = data.playback_ids?.[0]?.id;
      const duration = Math.round(data.duration || 0);

      console.log("Asset ready:", assetId, "playback:", playbackId, "duration:", duration);

      const thumbnailUrl = playbackId 
        ? `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1`
        : null;

      const { error } = await supabase
        .from("diary_entries")
        .update({
          mux_playback_id: playbackId,
          video_status: "ready",
          thumbnail_url: thumbnailUrl,
          duration: duration,
        })
        .eq("mux_asset_id", assetId);

      if (error) {
        console.error("Error updating entry:", error);
      }
    }

    // Handle auto-generated caption track ready
    if (type === "video.asset.track.ready") {
      const assetId = data.asset_id;
      const track = data;

      console.log("Track ready:", track.id, "type:", track.type, "text_source:", track.text_source);

      // Only process generated_vod (auto-generated captions)
      if (track.text_source === "generated_vod" && track.type === "text") {
        // Get the entry to find playback ID
        const { data: entry, error: fetchError } = await supabase
          .from("diary_entries")
          .select("mux_playback_id")
          .eq("mux_asset_id", assetId)
          .maybeSingle();

        if (fetchError || !entry) {
          console.error("Error fetching entry for transcript:", fetchError);
        } else if (entry.mux_playback_id) {
          // Fetch the transcript text
          const transcriptUrl = `https://stream.mux.com/${entry.mux_playback_id}/text/${track.id}.txt`;
          console.log("Fetching transcript from:", transcriptUrl);

          try {
            const transcriptResponse = await fetch(transcriptUrl);
            if (transcriptResponse.ok) {
              const transcriptText = await transcriptResponse.text();
              console.log("Transcript fetched, length:", transcriptText.length);

              const { error: updateError } = await supabase
                .from("diary_entries")
                .update({
                  mux_track_id: track.id,
                  transcript: transcriptText.trim(),
                })
                .eq("mux_asset_id", assetId);

              if (updateError) {
                console.error("Error updating transcript:", updateError);
              } else {
                console.log("Transcript saved successfully");
              }
            } else {
              console.error("Failed to fetch transcript:", transcriptResponse.status);
            }
          } catch (transcriptError) {
            console.error("Error fetching transcript:", transcriptError);
          }
        }
      }
    }

    if (type === "video.asset.errored") {
      const assetId = data.id;
      console.error("Asset errored:", assetId, data.errors);

      const { error } = await supabase
        .from("diary_entries")
        .update({
          video_status: "error",
        })
        .eq("mux_asset_id", assetId);

      if (error) {
        console.error("Error updating entry:", error);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
