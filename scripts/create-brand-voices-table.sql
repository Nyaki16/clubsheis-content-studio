-- Run this in the Supabase SQL Editor to create the brand_voices table
-- Dashboard: https://supabase.com/dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS brand_voices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  group_name TEXT NOT NULL DEFAULT 'Custom',
  description TEXT,
  sample_content TEXT,
  voice_profile TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE brand_voices ENABLE ROW LEVEL SECURITY;

-- Allow all operations with service role key (internal tool)
CREATE POLICY "Allow all with service role" ON brand_voices
  FOR ALL USING (true) WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_brand_voices_group ON brand_voices(group_name);
