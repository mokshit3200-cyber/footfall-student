-- ============================================================
-- Cmpus — Migration 007: Stories visibility + storage bucket
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE stories ADD COLUMN IF NOT EXISTS visibility text
  CHECK (visibility IN ('public', 'followers')) DEFAULT 'public';

INSERT INTO storage.buckets (id, name, public)
  VALUES ('stories', 'stories', true)
  ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Stories public read' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Stories public read" ON storage.objects
      FOR SELECT USING (bucket_id = 'stories');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Stories auth upload' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Stories auth upload" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Stories own delete' AND tablename = 'objects' AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Stories own delete" ON storage.objects
      FOR DELETE USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;
