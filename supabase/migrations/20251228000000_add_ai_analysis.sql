-- Add ai_analysis column to diary_entries to store the OpenAI response
ALTER TABLE public.diary_entries 
ADD COLUMN IF NOT EXISTS ai_analysis JSONB;
