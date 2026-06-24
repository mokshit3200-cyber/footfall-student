-- ============================================================
-- Footfall Student — Frequency Redesign Database Migration
-- Adds signals, intent, reach, hand-raises (signal_raises), 
-- message-requests (groups), and bookmarking (signal_saves) capabilities.
-- ============================================================

-- Create signals table if it does not exist
create table if not exists signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique,
  content text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Ensure signals has a primary key id column and unique user_id constraint
do $$
declare
  pk_name text;
begin
  -- 1. Create id column if it doesn't exist
  if not exists (select 1 from information_schema.columns where table_name='signals' and column_name='id') then
    alter table signals add column id uuid default gen_random_uuid();
  end if;

  -- 2. Find current primary key constraint
  select constraint_name into pk_name
  from information_schema.table_constraints
  where table_name = 'signals' and constraint_type = 'PRIMARY KEY';

  -- 3. If primary key exists and is on user_id, drop it
  if pk_name is not null then
    if exists (
      select 1 from information_schema.key_column_usage
      where table_name = 'signals' and constraint_name = pk_name and column_name = 'user_id'
    ) then
      execute 'alter table signals drop constraint ' || quote_ident(pk_name);
      pk_name := null;
    end if;
  end if;

  -- 4. Set id as primary key if no primary key exists
  if pk_name is null then
    alter table signals add primary key (id);
  end if;

  -- 5. Ensure user_id has a unique constraint (necessary for upsert targets)
  if not exists (
    select 1 from information_schema.table_constraints
    where table_name = 'signals' and constraint_type = 'UNIQUE' and constraint_name = 'signals_user_id_key'
  ) then
    alter table signals add constraint signals_user_id_key unique (user_id);
  end if;
end $$;

-- Signals: add intent + reach columns
alter table signals add column if not exists intent text
  check (intent in ('free','study','help','looking','event','sell'));

alter table signals add column if not exists reach text
  check (reach in ('campus','all')) default 'campus';

-- Enable RLS on signals (if not already enabled)
alter table signals enable row level security;

-- RLS Policies for signals
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'signals visible to same college or reach all' and tablename = 'signals') then
    create policy "signals visible to same college or reach all" on signals for select
      using (
        reach = 'all'
        or user_id = auth.uid()
        or (select college from profiles where id = signals.user_id) = (select college from profiles where id = auth.uid())
      );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'signals insert own' and tablename = 'signals') then
    create policy "signals insert own" on signals for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'signals update own' and tablename = 'signals') then
    create policy "signals update own" on signals for update
      using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'signals delete own' and tablename = 'signals') then
    create policy "signals delete own" on signals for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- Hand raises (responder interest on a signal)
create table if not exists signal_raises (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references signals(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(signal_id, user_id)
);

alter table signal_raises enable row level security;

-- RLS Policies for signal_raises
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'raises insert own' and tablename = 'signal_raises') then
    create policy "raises insert own" on signal_raises for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'raises visible to owner or raiser' and tablename = 'signal_raises') then
    create policy "raises visible to owner or raiser" on signal_raises for select
      using (
        auth.uid() = user_id
        or auth.uid() = (select user_id from signals where signals.id = signal_raises.signal_id)
      );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'raises delete own' and tablename = 'signal_raises') then
    create policy "raises delete own" on signal_raises for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- DM threads: request status for message-requests (Instagram-style)
alter table groups add column if not exists request_status text
  check (request_status in ('pending','accepted')) default 'accepted';
alter table groups add column if not exists requested_by uuid references profiles(id);
alter table groups add column if not exists origin_signal_id uuid references signals(id);

-- Saved signals (bookmark)
create table if not exists signal_saves (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid references signals(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(signal_id, user_id)
);

alter table signal_saves enable row level security;

-- RLS Policies for signal_saves
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'saves own' and tablename = 'signal_saves') then
    create policy "saves own" on signal_saves for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;
