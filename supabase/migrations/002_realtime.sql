-- Enable Supabase Realtime for the posts table so that
-- postgres_changes subscriptions receive INSERT/UPDATE/DELETE events.
-- Run this once in the Supabase SQL editor (Dashboard > SQL Editor)
-- or via `supabase db push`.

alter publication supabase_realtime add table public.posts;
