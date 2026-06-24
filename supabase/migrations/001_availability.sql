-- ============================================================
-- Footfall Student — Availability status for Frequency signals
-- Adds a per-user availability state shown on the Messages
-- Frequency strip (free / in class / studying / busy).
-- Run this in the Supabase SQL Editor.
-- ============================================================

alter table profiles
  add column if not exists availability text
  check (availability in ('free', 'class', 'studying', 'busy'));

-- null = no status set (default). The app reads/writes profiles.availability
-- alongside profiles.bio (the note text) when a user shares their signal.
