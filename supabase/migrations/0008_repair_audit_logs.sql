create table if not exists public.audit_logs(
 id uuid primary key default gen_random_uuid(),
 user_id uuid references public.profiles(id) on delete set null,
 action text not null,
 entity_type text not null,
 entity_id uuid,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
alter table public.audit_logs add column if not exists user_id uuid references public.profiles(id) on delete set null;
alter table public.audit_logs add column if not exists action text;
alter table public.audit_logs add column if not exists entity_type text;
alter table public.audit_logs add column if not exists entity_id uuid;
alter table public.audit_logs add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.audit_logs add column if not exists created_at timestamptz not null default now();
alter table public.audit_logs enable row level security;
drop policy if exists "platform admin reads audit" on public.audit_logs;
create policy "platform admin reads audit" on public.audit_logs for select to authenticated using(public.is_platform_admin());
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
notify pgrst,'reload schema';
