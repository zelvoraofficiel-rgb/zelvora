begin;
create table if not exists public.push_subscriptions(
 id uuid primary key default gen_random_uuid(),
 store_id uuid not null references public.stores(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 endpoint text not null unique,
 p256dh text not null,
 auth text not null,
 user_agent text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists push_subscriptions_store_idx on public.push_subscriptions(store_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists push_subscriptions_owner_all on public.push_subscriptions;
create policy push_subscriptions_owner_all on public.push_subscriptions for all using(user_id=auth.uid() and public.can_access_store(store_id)) with check(user_id=auth.uid() and public.can_access_store(store_id));
notify pgrst,'reload schema';commit;
