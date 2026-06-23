-- ============================================================
-- Footfall Student — Full Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── Profiles (extends auth.users) ──────────────────────────
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null default '',
  college text not null default '',
  course text default '',
  year int default 1,
  avatar_url text,
  bio text,
  skills text[],
  links jsonb default '{}',
  verified boolean default false,
  business_name text,
  business_type text check (business_type in ('sell', 'service', 'club')),
  business_contact text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Public profiles viewable by same college"
  on profiles for select
  using (
    college = (select college from profiles where id = auth.uid())
    or id = auth.uid()
  );

create policy "Own profile insert"
  on profiles for insert
  with check (id = auth.uid());

create policy "Own profile update"
  on profiles for update
  using (id = auth.uid());

-- Auto-create profile row when user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, college, course)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'college', ''),
    coalesce(new.raw_user_meta_data->>'course', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();


-- ── Subjects ───────────────────────────────────────────────
create table subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles on delete cascade not null,
  name text not null,
  code text,
  teacher text,
  total_classes int default 0,
  attended int default 0,
  target_pct int default 75,
  color text default '#7c3aed',
  created_at timestamptz default now()
);

alter table subjects enable row level security;

create policy "Own subjects"
  on subjects for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ── Attendance ─────────────────────────────────────────────
create table attendance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles on delete cascade not null,
  subject_id uuid references subjects on delete cascade not null,
  date date not null,
  present boolean not null,
  created_at timestamptz default now(),
  unique(user_id, subject_id, date)
);

alter table attendance enable row level security;

create policy "Own attendance"
  on attendance for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ── Grades ─────────────────────────────────────────────────
create table grades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles on delete cascade not null,
  subject_name text not null,
  type text check (type in ('internal', 'external', 'practical', 'assignment', 'other')) default 'other',
  obtained numeric not null,
  total numeric not null,
  created_at timestamptz default now()
);

alter table grades enable row level security;

create policy "Own grades"
  on grades for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ── Expenses ───────────────────────────────────────────────
create table expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles on delete cascade not null,
  amount numeric not null,
  category text not null,
  note text,
  date date default current_date,
  created_at timestamptz default now()
);

alter table expenses enable row level security;

create policy "Own expenses"
  on expenses for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ── Splits ─────────────────────────────────────────────────
create table splits (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles on delete cascade not null,
  description text not null,
  total_amount numeric not null,
  split_with jsonb default '[]',
  date date default current_date,
  created_at timestamptz default now()
);

alter table splits enable row level security;

create policy "Own splits"
  on splits for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ── Deadlines ──────────────────────────────────────────────
create table deadlines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles on delete cascade not null,
  title text not null,
  subject text,
  due_date date not null,
  completed boolean default false,
  created_at timestamptz default now()
);

alter table deadlines enable row level security;

create policy "Own deadlines"
  on deadlines for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ── Marketplace Listings ───────────────────────────────────
create table listings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles on delete cascade not null,
  title text not null,
  description text,
  price numeric not null,
  category text not null,
  images text[],
  active boolean default true,
  college text not null,
  created_at timestamptz default now()
);

alter table listings enable row level security;

create policy "View active listings in same college"
  on listings for select
  using (
    college = (select college from profiles where id = auth.uid())
    and active = true
  );

create policy "Manage own listings"
  on listings for insert
  with check (user_id = auth.uid());

create policy "Update own listings"
  on listings for update
  using (user_id = auth.uid());

create policy "Delete own listings"
  on listings for delete
  using (user_id = auth.uid());


-- ── Groups (DMs + group chats) ─────────────────────────────
create table groups (
  id uuid default gen_random_uuid() primary key,
  name text,
  type text check (type in ('dm', 'group')) not null,
  avatar text,
  college text,
  created_by uuid references profiles on delete set null,
  created_at timestamptz default now()
);

alter table groups enable row level security;

create policy "Members can view groups"
  on groups for select
  using (id in (select group_id from group_members where user_id = auth.uid()));

create policy "Create group"
  on groups for insert
  with check (created_by = auth.uid());

create policy "Admin can update group"
  on groups for update
  using (id in (
    select group_id from group_members where user_id = auth.uid() and role = 'admin'
  ));


-- ── Group Members ──────────────────────────────────────────
create table group_members (
  group_id uuid references groups on delete cascade,
  user_id uuid references profiles on delete cascade,
  role text check (role in ('admin', 'member')) default 'member',
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

alter table group_members enable row level security;

create policy "View group membership"
  on group_members for select
  using (group_id in (select group_id from group_members where user_id = auth.uid()));

create policy "Join group"
  on group_members for insert
  with check (user_id = auth.uid());

create policy "Leave or admin remove"
  on group_members for delete
  using (
    user_id = auth.uid()
    or group_id in (
      select group_id from group_members where user_id = auth.uid() and role = 'admin'
    )
  );


-- ── Messages ───────────────────────────────────────────────
create table messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups on delete cascade not null,
  sender_id uuid references profiles on delete set null,
  content text not null,
  type text check (type in ('text', 'image')) default 'text',
  created_at timestamptz default now()
);

alter table messages enable row level security;

create policy "Members can read messages"
  on messages for select
  using (group_id in (select group_id from group_members where user_id = auth.uid()));

create policy "Members can send messages"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and group_id in (select group_id from group_members where user_id = auth.uid())
  );


-- ── Stories ────────────────────────────────────────────────
create table stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles on delete cascade not null,
  content text,
  media_url text,
  expires_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now()
);

alter table stories enable row level security;

create policy "View non-expired stories from same college"
  on stories for select
  using (
    expires_at > now()
    and user_id in (
      select id from profiles
      where college = (select college from profiles where id = auth.uid())
    )
  );

create policy "Manage own stories"
  on stories for insert
  with check (user_id = auth.uid());

create policy "Delete own stories"
  on stories for delete
  using (user_id = auth.uid());


-- ── Campus Businesses ──────────────────────────────────────
create table campus_businesses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles on delete cascade not null,
  name text not null,
  type text not null,
  college text not null,
  description text,
  contact text,
  hours text,
  verified boolean default false,
  created_at timestamptz default now()
);

alter table campus_businesses enable row level security;

create policy "View businesses in same college"
  on campus_businesses for select
  using (college = (select college from profiles where id = auth.uid()));

create policy "Manage own business"
  on campus_businesses for insert
  with check (user_id = auth.uid());

create policy "Update own business"
  on campus_businesses for update
  using (user_id = auth.uid());

create policy "Delete own business"
  on campus_businesses for delete
  using (user_id = auth.uid());


-- ── Realtime ───────────────────────────────────────────────
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table stories;
