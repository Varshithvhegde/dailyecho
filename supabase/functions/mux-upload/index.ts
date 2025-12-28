import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MUX_TOKEN_ID = Deno.env.get("MUX_TOKEN_ID");
    const MUX_TOKEN_SECRET = Deno.env.get("MUX_TOKEN_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
      console.error("Missing Mux credentials");
      throw new Error("Mux credentials not configured");
    }

    // Get the authorization header to identify the user
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

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { mood, date } = await req.json();
    console.log("Creating Mux upload for user:", user.id, "mood:", mood, "date:", date);

    // Create Mux Direct Upload URL
    const muxAuth = btoa(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`);
    
    const muxResponse = await fetch("https://api.mux.com/video/v1/uploads", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${muxAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cors_origin: "*",
        new_asset_settings: {
          playback_policy: ["public"],
          encoding_tier: "baseline",
          input: [
            {
              generated_subtitles: [
                {
                  language_code: "en",
                  name: "English CC",
                },
              ],
            },
          ],
        },
      }),
    });

    if (!muxResponse.ok) {
      const errorText = await muxResponse.text();
      console.error("Mux API error:", muxResponse.status, errorText);
      throw new Error(`Mux API error: ${muxResponse.status}`);
    }

    const muxData = await muxResponse.json();
    console.log("Mux upload created:", muxData.data.id);

    // Create diary entry record in database
    const { data: entry, error: insertError } = await supabase
      .from("diary_entries")
      .insert({
        user_id: user.id,
        mood: mood,
        date: date || new Date().toISOString().split("T")[0],
        mux_upload_id: muxData.data.id,
        video_status: "uploading",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error("Failed to create diary entry");
    }

    console.log("Diary entry created:", entry.id);

    return new Response(
      JSON.stringify({
        uploadUrl: muxData.data.url,
        uploadId: muxData.data.id,
        entryId: entry.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in mux-upload:", error);
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
