
-- Create enum for video format
CREATE TYPE public.video_format AS ENUM ('VSL', 'Criativo');

-- Create table for video edits
CREATE TABLE public.video_edits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  edit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  client_name TEXT NOT NULL,
  video_format video_format NOT NULL,
  editor_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_edits ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read and insert (no auth required for simplicity)
CREATE POLICY "Anyone can view edits" ON public.video_edits FOR SELECT USING (true);
CREATE POLICY "Anyone can insert edits" ON public.video_edits FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update edits" ON public.video_edits FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete edits" ON public.video_edits FOR DELETE USING (true);
