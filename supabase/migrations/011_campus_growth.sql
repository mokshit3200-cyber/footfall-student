-- ============================================================
-- 011 — Campus growth: OG Lounge automation + announcement read-only
-- Run in Supabase SQL Editor (footfall-student). Run AFTER 009 + 010.
--
-- NOTE: rank assignment is intentionally NOT redefined here. Migration 009
-- already installs a RACE-SAFE assign_signup_ranks() (sequence + advisory
-- lock). Re-creating it with count(*)+1 would reintroduce duplicate-rank
-- bugs under concurrent signups, so that part was removed.
-- ============================================================

-- 1. Columns (idempotent; 009 already added the rank/ambassador ones) -------
alter table profiles add column if not exists is_ambassador boolean default false;
alter table profiles add column if not exists ambassador_role text;
alter table profiles add column if not exists global_signup_rank integer;
alter table profiles add column if not exists campus_signup_rank integer;

-- announcement flag for read-only lounge groups
alter table groups add column if not exists is_announcement boolean default false;

-- 2. Auto-create + join the campus OG Lounge for OG members (rank <= 999) ---
--    Runs AFTER insert, so campus_signup_rank (set by 009's BEFORE trigger)
--    is already populated.
create or replace function automate_og_lounge_membership()
returns trigger as $$
declare
  lounge_group_id uuid;
begin
  if new.college is not null and new.college <> '' and new.campus_signup_rank <= 999 then
    select id into lounge_group_id
    from groups
    where name = 'OG Lounge - ' || new.college
      and type = 'group'
      and college = new.college
    limit 1;

    if lounge_group_id is null then
      insert into groups (name, type, college, is_announcement)
      values ('OG Lounge - ' || new.college, 'group', new.college, true)
      returning id into lounge_group_id;
    end if;

    insert into group_members (group_id, user_id, role)
    values (lounge_group_id, new.id, 'member')
    on conflict (group_id, user_id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_automate_og_lounge_membership on profiles;
create trigger tr_automate_og_lounge_membership
  after insert on profiles
  for each row
  execute function automate_og_lounge_membership();

-- 3. Read-only enforcement: only admins/ambassadors can post to announcement
--    (OG Lounge) groups. Server-side, so it can't be bypassed via the API.
drop policy if exists "Members can send messages" on messages;
create policy "Members can send messages"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and group_id in (
      select gm.group_id
      from group_members gm
      join groups g on g.id = gm.group_id
      left join profiles p on p.id = auth.uid()
      where gm.user_id = auth.uid()
        and (
          g.is_announcement = false
          or gm.role = 'admin'
          or coalesce(p.is_ambassador, false) = true
        )
    )
  );
