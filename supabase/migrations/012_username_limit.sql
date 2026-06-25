-- Add username_changed_at column to profiles to limit username updates to twice a month
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username_changed_at timestamptz[] DEFAULT '{}';
