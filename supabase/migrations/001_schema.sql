-- ContentFlow AI — Database Schema
-- Run this in your Supabase SQL editor (Dashboard > SQL Editor)

-- =====================
-- TABLE: profiles
-- =====================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro')),
  created_at timestamptz default now()
);

-- =====================
-- TABLE: usage_limits
-- =====================
create table if not exists public.usage_limits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  tokens_used int default 0,
  max_tokens int default 5,
  reset_date timestamptz
);

-- =====================
-- TABLE: posts
-- =====================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  platform text check (platform in ('linkedin', 'twitter', 'telegram')),
  scheduled_for timestamptz,
  status text default 'draft' check (status in ('draft', 'scheduled', 'published')),
  ai_prompt text,
  created_at timestamptz default now()
);

-- =====================
-- TABLE: generation_history
-- =====================
create table if not exists public.generation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prompt text,
  result text,
  platform text check (platform in ('linkedin', 'twitter', 'telegram')),
  tone text check (tone in ('professional', 'casual', 'witty')),
  created_at timestamptz default now()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

alter table public.profiles enable row level security;
alter table public.usage_limits enable row level security;
alter table public.posts enable row level security;
alter table public.generation_history enable row level security;

-- profiles: users can manage their own row (id = auth.uid())
create policy "own profile" on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- usage_limits: users can manage their own row
create policy "own usage" on public.usage_limits
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- posts: users can manage their own posts
create policy "own posts" on public.posts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- generation_history: users can manage their own history
create policy "own history" on public.generation_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =====================
-- TRIGGER: auto-create profile + usage_limits on signup
-- =====================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );

  insert into public.usage_limits (user_id, tokens_used, max_tokens, reset_date)
  values (
    new.id,
    0,
    5,
    now() + interval '30 days'
  );

  return new;
end;
$$;

-- Drop trigger if it already exists to allow re-running this script
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
