begin;
create table if not exists public.saspay_subscription_payments(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,user_id uuid not null references public.profiles(id) on delete cascade,plan_id uuid not null references public.plans(id) on delete restrict,billing_interval text not null check(billing_interval in('MONTHLY','YEARLY')),amount numeric(12,2) not null check(amount>0),currency text not null default 'XOF',status text not null default 'CREATING' check(status in('CREATING','PENDING','SUCCESS','FAILED','EXPIRED','CANCELLED')),checkout_session_id uuid unique,checkout_url text,transaction_id uuid unique,transaction_reference text,idempotency_key uuid not null unique,error_code text,expires_at timestamptz,processed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create unique index if not exists saspay_one_open_payment_per_org on public.saspay_subscription_payments(organization_id) where status in('CREATING','PENDING');
create index if not exists saspay_payments_user_created_idx on public.saspay_subscription_payments(user_id,created_at desc);
alter table public.saspay_subscription_payments enable row level security;
drop policy if exists saspay_users_read_own on public.saspay_subscription_payments;
create policy saspay_users_read_own on public.saspay_subscription_payments for select to authenticated using(user_id=auth.uid() or public.is_platform_admin());

create table if not exists public.saspay_webhook_events(
 id uuid primary key default gen_random_uuid(),event_key text not null unique,event_type text not null,transaction_id uuid,received_at timestamptz not null default now(),processed_at timestamptz,status text not null default 'RECEIVED' check(status in('RECEIVED','PROCESSED','IGNORED','FAILED')),error_message text);
alter table public.saspay_webhook_events enable row level security;

create or replace function public.activate_saspay_subscription(p_payment_id uuid,p_transaction_id uuid,p_reference text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare p public.saspay_subscription_payments;s uuid;period_end timestamptz;begin
 select * into p from public.saspay_subscription_payments where id=p_payment_id for update;if not found then raise exception 'Paiement introuvable';end if;
 if p.status='SUCCESS' then return jsonb_build_object('payment_id',p.id,'subscription_id',(select id from subscriptions where provider='SASPAY' and provider_reference=p_transaction_id::text order by created_at desc limit 1),'already_processed',true);end if;
 if p.status not in('CREATING','PENDING') then raise exception 'État de paiement non activable';end if;
 period_end:=now()+case when p.billing_interval='YEARLY' then interval '1 year' else interval '1 month' end;
 update subscriptions set status='EXPIRED',updated_at=now() where organization_id=p.organization_id and status in('TRIAL','ACTIVE','PAST_DUE');
 insert into subscriptions(organization_id,plan_id,owner_user_id,status,billing_interval,provider,provider_reference,current_period_end) values(p.organization_id,p.plan_id,p.user_id,'ACTIVE',p.billing_interval,'SASPAY',p_transaction_id::text,period_end) returning id into s;
 update saspay_subscription_payments set status='SUCCESS',transaction_id=p_transaction_id,transaction_reference=p_reference,processed_at=now(),updated_at=now() where id=p.id;
 return jsonb_build_object('payment_id',p.id,'subscription_id',s,'current_period_end',period_end,'already_processed',false);end$$;
revoke all on function public.activate_saspay_subscription(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.activate_saspay_subscription(uuid,uuid,text) to service_role;
notify pgrst,'reload schema';commit;
