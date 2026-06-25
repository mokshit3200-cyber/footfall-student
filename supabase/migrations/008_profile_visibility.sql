-- ============================================================
-- 008 — Profile visibility for follow relationships + storefront
-- Run this in the Supabase SQL Editor (footfall-student project).
--
-- WHY: profiles currently can ONLY be SELECTed by people in the SAME
-- college (see 000_schema.sql "Public profiles viewable by same college").
-- A follow REQUEST can come from another campus, so when you open the
-- requester's profile to decide accept/decline, the DB returns nothing
-- and the UI looks broken. This adds an OR policy so anyone who has a
-- follow row with you (pending OR accepted, either direction) is viewable.
-- RLS policies are combined with OR, so the same-college policy still works.
-- ============================================================

-- 1. View the profile of anyone you have a follow relationship with
--    (covers: people who requested to follow you = pending followers,
--     people you requested, mutuals, cross-campus follows).
DROP POLICY IF EXISTS "View profiles with follow relationship" ON profiles;
CREATE POLICY "View profiles with follow relationship"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT follower_id  FROM follows WHERE following_id = auth.uid()
      UNION
      SELECT following_id FROM follows WHERE follower_id  = auth.uid()
    )
  );

-- 2. (Optional storefront) Let people you follow / who follow you see your
--    ACTIVE listings even across campuses, so the storefront on a profile
--    isn't empty for cross-campus mutuals. Same-college policy still applies.
DROP POLICY IF EXISTS "View listings of follow relationships" ON listings;
CREATE POLICY "View listings of follow relationships"
  ON listings FOR SELECT
  USING (
    active = true
    AND user_id IN (
      SELECT follower_id  FROM follows WHERE following_id = auth.uid()
      UNION
      SELECT following_id FROM follows WHERE follower_id  = auth.uid()
    )
  );

-- 3. Accurate follow counts for ANY profile.
--    The "View own follows" RLS only lets a user read follow rows that
--    involve themselves, so counting another person's followers/following
--    client-side returns wrong numbers (0/1). This SECURITY DEFINER function
--    returns the true counts without exposing individual follow rows.
CREATE OR REPLACE FUNCTION get_follow_counts(profile_id uuid)
RETURNS TABLE (followers bigint, following bigint)
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT
    (SELECT count(*) FROM follows WHERE following_id = profile_id AND status = 'accepted'),
    (SELECT count(*) FROM follows WHERE follower_id  = profile_id AND status = 'accepted');
$$;

GRANT EXECUTE ON FUNCTION get_follow_counts(uuid) TO authenticated;

-- Nothing else changes. profiles already has every field the new profile
-- view needs: bio, links (jsonb: {github,linkedin,instagram,portfolio}),
-- business_name, business_type ('sell'|'service'|'club'), business_contact.
-- No new columns required.
--
-- Client usage (live mode):
--   const { data } = await supabase.rpc('get_follow_counts', { profile_id: peer.id });
--   // data?.[0] = { followers, following }
