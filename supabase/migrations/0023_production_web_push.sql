begin;

alter table public.push_subscriptions
  add column if not exists sound_enabled boolean not null default true,
  add column if not exists last_success_at timestamptz,
  add column if not exists last_error text;

create table if not exists public.push_delivery_log(
  id uuid primary key default gen_random_uuid(),
  order_key text not null,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  delivered_at timestamptz not null default now(),
  unique(order_key, subscription_id)
);
create index if not exists push_delivery_log_created_idx on public.push_delivery_log(delivered_at);
alter table public.push_delivery_log enable row level security;
-- Cette table technique est accessible uniquement avec la clé service côté serveur.
revoke all on public.push_delivery_log from anon, authenticated;

notify pgrst,'reload schema';
commit;
