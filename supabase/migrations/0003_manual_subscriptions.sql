-- Zelvora manual subscriptions (Niger). Apply after 0001 and 0002.
begin;

alter table public.profiles add column if not exists is_platform_admin boolean not null default false;

insert into public.plans(name,slug,price_monthly,price_yearly,currency,max_stores,features,active)
values ('PRO','pro',15000,180000,'XOF',1,'{"manual_payment":true}'::jsonb,true),
       ('BUSINESS','business',30000,360000,'XOF',3,'{"manual_payment":true}'::jsonb,true)
on conflict(slug) do update set name=excluded.name,price_monthly=excluded.price_monthly,currency='XOF',active=true,updated_at=now();
update public.plans set active=false where slug not in ('pro','business');

create table if not exists public.manual_payment_methods(
 id uuid primary key default gen_random_uuid(),
 code text not null unique check(code in ('mynita','amanata','airtel_money')),
 name text not null,
 account_number text not null default '',
 account_holder text not null default '',
 instructions text not null default '',
 active boolean not null default false,
 country_code text not null default 'NE' check(country_code='NE'),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
insert into public.manual_payment_methods(code,name) values ('mynita','MyNita'),('amanata','Amanata'),('airtel_money','Airtel Money') on conflict(code) do nothing;

create table if not exists public.subscription_payment_requests(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 plan_id uuid not null references public.plans(id) on delete restrict,
 payment_method_id uuid not null references public.manual_payment_methods(id) on delete restrict,
 amount numeric(12,2) not null check(amount>0), currency text not null default 'XOF' check(currency='XOF'),
 transaction_reference text,
 proof_path text not null,
 status text not null default 'PENDING' check(status in ('PENDING','CONFIRMED','REJECTED')),
 rejection_reason text,
 reviewed_by uuid references public.profiles(id) on delete set null,
 reviewed_at timestamptz,
 submitted_at timestamptz not null default now(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists one_pending_payment_per_org on public.subscription_payment_requests(organization_id) where status='PENDING';
create index if not exists payment_requests_admin_idx on public.subscription_payment_requests(status,submitted_at desc);

create table if not exists public.subscription_payment_history(
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.subscription_payment_requests(id) on delete cascade,
 old_status text, new_status text not null, actor_id uuid references public.profiles(id) on delete set null,
 reason text, created_at timestamptz not null default now()
);

create or replace function public.is_platform_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and is_platform_admin=true and status='ACTIVE'); $$;

alter table public.manual_payment_methods enable row level security;
alter table public.subscription_payment_requests enable row level security;
alter table public.subscription_payment_history enable row level security;

drop policy if exists "active methods authenticated read" on public.manual_payment_methods;
create policy "active methods authenticated read" on public.manual_payment_methods for select to authenticated using(active or public.is_platform_admin());
drop policy if exists "admin manages methods" on public.manual_payment_methods;
create policy "admin manages methods" on public.manual_payment_methods for all to authenticated using(public.is_platform_admin()) with check(public.is_platform_admin());
drop policy if exists "users read own payment requests" on public.subscription_payment_requests;
create policy "users read own payment requests" on public.subscription_payment_requests for select to authenticated using(user_id=auth.uid() or public.is_platform_admin());
drop policy if exists "users submit own payment requests" on public.subscription_payment_requests;
create policy "users submit own payment requests" on public.subscription_payment_requests for insert to authenticated with check(user_id=auth.uid() and public.is_org_member(organization_id) and status='PENDING');
drop policy if exists "admin updates payment requests" on public.subscription_payment_requests;
create policy "admin updates payment requests" on public.subscription_payment_requests for update to authenticated using(public.is_platform_admin()) with check(public.is_platform_admin());
drop policy if exists "history authorized read" on public.subscription_payment_history;
create policy "history authorized read" on public.subscription_payment_history for select to authenticated using(public.is_platform_admin() or exists(select 1 from public.subscription_payment_requests r where r.id=request_id and r.user_id=auth.uid()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('payment-proofs','payment-proofs',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf']) on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "users upload own payment proof" on storage.objects;
create policy "users upload own payment proof" on storage.objects for insert to authenticated with check(bucket_id='payment-proofs' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "proof authorized read" on storage.objects;
create policy "proof authorized read" on storage.objects for select to authenticated using(bucket_id='payment-proofs' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_platform_admin()));

create or replace function public.review_manual_payment(p_request_id uuid,p_action text,p_reason text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.subscription_payment_requests; v_status text; v_sub uuid; begin
 if not public.is_platform_admin() then raise exception 'Accès administrateur requis'; end if;
 if p_action not in ('CONFIRMED','REJECTED') then raise exception 'Action invalide'; end if;
 select * into r from public.subscription_payment_requests where id=p_request_id for update;
 if not found then raise exception 'Demande introuvable'; end if;
 if r.status <> 'PENDING' then raise exception 'Cette demande a déjà été traitée'; end if;
 if p_action='REJECTED' and coalesce(trim(p_reason),'')='' then raise exception 'Le motif du refus est obligatoire'; end if;
 update public.subscription_payment_requests set status=p_action,rejection_reason=case when p_action='REJECTED' then trim(p_reason) end,reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=r.id;
 insert into public.subscription_payment_history(request_id,old_status,new_status,actor_id,reason) values(r.id,'PENDING',p_action,auth.uid(),p_reason);
 if p_action='CONFIRMED' then
   update public.subscriptions set status='EXPIRED',updated_at=now() where organization_id=r.organization_id and status in ('TRIAL','ACTIVE','PAST_DUE');
   insert into public.subscriptions(organization_id,plan_id,owner_user_id,status,billing_interval,provider,provider_reference,current_period_end)
   values(r.organization_id,r.plan_id,r.user_id,'ACTIVE','MONTHLY','MANUAL',r.id::text,now()+interval '1 month') returning id into v_sub;
 end if;
 return jsonb_build_object('request_id',r.id,'status',p_action,'subscription_id',v_sub);
end $$;
grant execute on function public.review_manual_payment(uuid,text,text) to authenticated;
commit;

-- After applying, promote the real administrator once:
-- update public.profiles set is_platform_admin=true where email='ADMIN_EMAIL_HERE';
