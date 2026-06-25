-- ============================================================
-- 010 — Message reactions + delete/update policies
-- Run in Supabase SQL Editor (footfall-student).
-- ============================================================

-- Reactions storage on messages
alter table messages add column if not exists reactions jsonb default '[]'::jsonb;

-- Users can delete their own messages
drop policy if exists "Users can delete their own messages" on messages;
create policy "Users can delete their own messages"
  on messages for delete
  using (sender_id = auth.uid());

-- Group members can update messages (used for modifying the reactions list)
drop policy if exists "Users can update message reactions" on messages;
create policy "Users can update message reactions"
  on messages for update
  using (
    group_id in (select group_id from group_members where user_id = auth.uid())
  );
