-- Add track_id column for storing the auto-generated caption track ID
ALTER TABLE public.diary_entries 
ADD COLUMN IF NOT EXISTS mux_track_id text;