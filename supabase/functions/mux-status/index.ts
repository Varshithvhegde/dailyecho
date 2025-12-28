import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MUX_TOKEN_ID = Deno.env.get("MUX_TOKEN_ID");
    const MUX_TOKEN_SECRET = Deno.env.get("MUX_TOKEN_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      throw new Error("Mux credentials not configured");
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { entryId } = await req.json();
    console.log("Checking status for entry:", entryId);

    // Get the entry
    const { data: entry, error: entryError } = await supabase
      .from("diary_entries")
      .select("*")
      .eq("id", entryId)
      .eq("user_id", user.id)
      .single();

    if (entryError || !entry) {
      throw new Error("Entry not found");
    }

    // If we have an upload ID but no asset yet, check Mux for the asset
    if (entry.mux_upload_id && !entry.mux_asset_id) {
      const muxAuth = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);
      
      const uploadResponse = await fetch(
        `https://api.mux.com/video/v1/uploads/${entry.mux_upload_id}`,
        {
          headers: {
            "Authorization": `Basic ${muxAuth}`,
          },
        }
      );

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        console.log("Upload status:", uploadData.data.status);

        if (uploadData.data.asset_id) {
          // Update with asset ID
          await supabase
            .from("diary_entries")
            .update({
              mux_asset_id: uploadData.data.asset_id,
              video_status: "processing",
            })
            .eq("id", entryId);

          entry.mux_asset_id = uploadData.data.asset_id;
          entry.video_status = "processing";
        }
      }
    }

    // If we have an asset ID, check its status
    if (entry.mux_asset_id && entry.video_status !== "ready") {
      const muxAuth = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);
      
      const assetResponse = await fetch(
        `https://api.mux.com/video/v1/assets/${entry.mux_asset_id}`,
        {
          headers: {
            "Authorization": `Basic ${muxAuth}`,
          },
        }
      );

      if (assetResponse.ok) {
        const assetData = await assetResponse.json();
        console.log("Asset status:", assetData.data.status);

        if (assetData.data.status === "ready") {
          const playbackId = assetData.data.playback_ids?.[0]?.id;
          const duration = Math.round(assetData.data.duration || 0);
          const thumbnailUrl = playbackId 
            ? `https://image.mux.com/${playbackId}/thumbnail.jpg?time=1`
            : null;

          await supabase
            .from("diary_entries")
            .update({
              mux_playback_id: playbackId,
              video_status: "ready",
              thumbnail_url: thumbnailUrl,
              duration: duration,
            })
            .eq("id", entryId);

          entry.mux_playback_id = playbackId;
          entry.video_status = "ready";
          entry.thumbnail_url = thumbnailUrl;
          entry.duration = duration;
        } else if (assetData.data.status === "errored") {
          await supabase
            .from("diary_entries")
            .update({ video_status: "error" })
            .eq("id", entryId);

          entry.video_status = "error";
        }
      }
    }

    return new Response(
      JSON.stringify({
        status: entry.video_status,
        playbackId: entry.mux_playback_id,
        thumbnailUrl: entry.thumbnail_url,
        duration: entry.duration,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mux-status:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
