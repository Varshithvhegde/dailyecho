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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("Missing OpenAI API Key");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Verify Auth
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get Request Body
    const { entryId } = await req.json();
    if (!entryId) {
      throw new Error("Missing entryId");
    }

    // 3. Fetch Entry
    const { data: entry, error: fetchError } = await supabase
      .from("diary_entries")
      .select("transcript, mood, date")
      .eq("id", entryId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !entry) {
      throw new Error("Entry not found or access denied");
    }

    if (!entry.transcript) {
      return new Response(
        JSON.stringify({ error: "No transcript available for this entry" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Call OpenAI
    console.log("Analyzing entry:", entryId);
    
    const systemPrompt = `You are a supremely wise, empathetic, and insightful personal journaling assistant. 
    Analyze the user's diary entry transcript. 
    The user indicated their mood was: "${entry.mood}".
    
    Return a JSON object with the following fields:
    - title: A creative, short 3-5 word title for this entry.
    - summary: A concise 2-sentence summary of the entry.
    - emotional_analysis: A friendly paragraph analyzing their emotions. Does it match their selected mood ("${entry.mood}")?
    - key_topics: An array of 3-5 tags/topics.
    - advice: A piece of actionable, warm, or stoic advice based on what they said.
    - sentiment_score: A number from 0 (very negative) to 100 (very positive).
    
    Keep the tone supportive and private.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: entry.transcript },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenAI Error:", err);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const result = JSON.parse(aiData.choices[0].message.content);

    // 5. Update Database
    const { error: updateError } = await supabase
      .from("diary_entries")
      .update({ ai_analysis: result })
      .eq("id", entryId);

    if (updateError) {
      throw new Error("Failed to save analysis to database");
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-entry:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
