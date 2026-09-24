-- Zelvora MVP foundation for Supabase PostgreSQL
-- Run this entire file once in: Supabase Dashboard → SQL Editor → New query.
-- It is deliberately written without a service-role key: normal app requests rely on RLS + auth.uid().

begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null default 'Marchand',
  phone text,
  whatsapp text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED', 'DELETED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'OWNER' check (role in ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  price_monthly numeric(12,2) not null default 0,
  price_yearly numeric(12,2) not null default 0,
  currency text not null default 'XOF',
  max_products integer,
  max_orders integer,
  max_customers integer,
  max_ai_generations integer,
  max_stores integer not null default 1,
  features jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.plans (name, slug, max_products, max_orders, max_customers, max_ai_generations, max_stores, features)
values ('Gratuit', 'free', 6, 5, 50, 5, 1, '{"subdomain":true,"dashboard":true,"cash_on_delivery":true}'::jsonb)
on conflict (slug) do nothing;

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'TRIAL' check (status in ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')),
  billing_interval text not null default 'MONTHLY' check (billing_interval in ('MONTHLY', 'YEARLY')),
  provider text,
  provider_reference text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  tagline text not null default 'Découvrez notre sélection.',
  status text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED', 'SUSPENDED', 'ARCHIVED')),
  currency text not null default 'XOF',
  country_code text not null default 'NE',
  primary_color text not null default '#6557F5' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color text not null default '#B9F6D0' check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  order_sequence integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  logo_path text,
  favicon_path text,
  font_family text not null default 'Inter',
  checkout_settings jsonb not null default '{}'::jsonb,
  seo_settings jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.store_pages (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  page_type text not null,
  title text not null,
  slug text not null,
  content jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, slug)
);

create table if not exists public.store_sections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  page_id uuid references public.store_pages(id) on delete cascade,
  section_type text not null,
  position integer not null default 0,
  content jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique(store_id, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  product_type text not null default 'PHYSICAL' check (product_type in ('PHYSICAL', 'DIGITAL', 'SERVICE')),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  name text not null check (char_length(name) between 2 and 140),
  slug text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2),
  stock integer,
  sku text,
  image_path text,
  source_type text not null check (source_type in ('LINK', 'IMAGE', 'MANUAL')),
  source_url text,
  benefits jsonb not null default '[]'::jsonb,
  specifications jsonb not null default '[]'::jsonb,
  faqs jsonb not null default '[]'::jsonb,
  ai_review_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, slug)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  price numeric(12,2),
  stock integer,
  options jsonb not null default '{}'::jsonb
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  email text,
  phone text not null,
  whatsapp text,
  order_count integer not null default 0,
  total_spent numeric(12,2) not null default 0,
  last_order_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, phone)
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  country text not null,
  city text not null,
  district text,
  address text,
  notes text,
  is_default boolean not null default false
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  number text not null,
  status text not null default 'NEW' check (status in ('NEW', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED')),
  payment_status text not null default 'PENDING' check (payment_status in ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED')),
  payment_method text not null default 'CASH_ON_DELIVERY',
  currency text not null default 'XOF',
  total numeric(12,2) not null check (total >= 0),
  quantity integer not null check (quantity > 0),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  delivery jsonb not null default '{}'::jsonb,
  customer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, number)
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  title text not null,
  sku text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  total numeric(12,2) not null,
  snapshot jsonb not null default '{}'::jsonb
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_ref text,
  amount numeric(12,2) not null,
  currency text not null,
  status text not null default 'PENDING',
  raw_payload jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_credits (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  balance integer not null default 5,
  monthly_limit integer not null default 5,
  reset_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  generation_type text not null,
  provider text not null,
  status text not null default 'PENDING',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  credits_used integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null default 'ORDER',
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  public_url text,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_daily (
  store_id uuid not null references public.stores(id) on delete cascade,
  day date not null,
  revenue numeric(12,2) not null default 0,
  orders_count integer not null default 0,
  customers_count integer not null default 0,
  visitors integer not null default 0,
  primary key (store_id, day)
);

create table if not exists public.domains (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  hostname text not null unique,
  domain_type text not null default 'SUBDOMAIN',
  status text not null default 'PENDING',
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists stores_organization_status_idx on public.stores(organization_id, status);
create index if not exists products_store_status_idx on public.products(store_id, status);
create index if not exists orders_store_status_created_idx on public.orders(store_id, status, created_at desc);
create index if not exists customers_store_phone_idx on public.customers(store_id, phone);
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index if not exists store_sections_store_position_idx on public.store_sections(store_id, position);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, coalesce(new.email, ''), coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), 'Marchand'))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace function public.handle_new_organization()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.created_by_id, 'OWNER') on conflict do nothing;
  insert into public.ai_credits (organization_id, balance, monthly_limit)
  values (new.id, 5, 5) on conflict do nothing;
  insert into public.subscriptions (organization_id, plan_id, owner_user_id, status)
  select new.id, p.id, new.created_by_id, 'TRIAL' from public.plans p where p.slug = 'free'
  on conflict do nothing;
  return new;
end;
$$;

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organization_members m where m.organization_id = p_organization_id and m.user_id = auth.uid());
$$;

create or replace function public.is_org_owner(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.organization_members m where m.organization_id = p_organization_id and m.user_id = auth.uid() and m.role in ('OWNER', 'ADMIN'));
$$;

create or replace function public.can_access_store(p_store_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.stores s where s.id = p_store_id and public.is_org_member(s.organization_id));
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
drop trigger if exists on_organization_created on public.organizations;
create trigger on_organization_created after insert on public.organizations for each row execute procedure public.handle_new_organization();

-- New profiles for pre-existing auth users (safe if none exist).
insert into public.profiles (id, email, name)
select id, coalesce(email, ''), coalesce(nullif(raw_user_meta_data ->> 'name', ''), 'Marchand') from auth.users
on conflict (id) do nothing;

-- Updated timestamps.
do $$ declare tab text; begin
  foreach tab in array array['profiles','organizations','plans','subscriptions','stores','store_pages','store_sections','products','customers','orders','ai_credits'] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', tab, tab);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute procedure public.set_updated_at()', tab, tab);
  end loop;
end $$;

-- First-login bootstrap. It runs as the database owner but derives the merchant solely from auth.uid().
create or replace function public.bootstrap_current_organization()
returns table(organization_id uuid, organization_name text, organization_slug text)
language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid(); v_name text; v_organization public.organizations%rowtype;
begin
  if v_user_id is null then raise exception 'Utilisateur non authentifié.' using errcode = '28000'; end if;
  select o.* into v_organization from public.organization_members m join public.organizations o on o.id = m.organization_id where m.user_id = v_user_id order by o.created_at asc limit 1;
  if found then return query select v_organization.id, v_organization.name, v_organization.slug; return; end if;
  select coalesce(nullif(trim(name), ''), 'Ma') into v_name from public.profiles where id = v_user_id;
  if v_name is null then raise exception 'Profil marchand introuvable.' using errcode = 'P0002'; end if;
  insert into public.organizations(name, slug, created_by_id) values (v_name || ' entreprise', 'boutique-' || replace(gen_random_uuid()::text, '-', '')::text, v_user_id) returning * into v_organization;
  return query select v_organization.id, v_organization.name, v_organization.slug;
end;
$$;
grant execute on function public.bootstrap_current_organization() to authenticated;

-- RLS defaults: no table is exposed until a precise policy is declared.
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.stores enable row level security;
alter table public.store_settings enable row level security;
alter table public.store_pages enable row level security;
alter table public.store_sections enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.ai_credits enable row level security;
alter table public.ai_generations enable row level security;
alter table public.notifications enable row level security;
alter table public.files enable row level security;
alter table public.analytics_daily enable row level security;
alter table public.domains enable row level security;

create policy "profile own read" on public.profiles for select using (id = auth.uid());
create policy "profile own update" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "organization member read" on public.organizations for select using (public.is_org_member(id));
create policy "organization self create" on public.organizations for insert with check (created_by_id = auth.uid());
create policy "organization owner update" on public.organizations for update using (public.is_org_owner(id)) with check (public.is_org_owner(id));
create policy "organization owner delete" on public.organizations for delete using (public.is_org_owner(id));

create policy "members read inside organization" on public.organization_members for select using (public.is_org_member(organization_id));
create policy "owners manage members" on public.organization_members for all using (public.is_org_owner(organization_id)) with check (public.is_org_owner(organization_id));

create policy "plans public read" on public.plans for select using (active = true);
create policy "subscriptions member read" on public.subscriptions for select using (public.is_org_member(organization_id));

create policy "stores member or public read" on public.stores for select using (status = 'PUBLISHED' or public.is_org_member(organization_id));
create policy "stores member create" on public.stores for insert with check (owner_id = auth.uid() and public.is_org_member(organization_id));
create policy "stores member update" on public.stores for update using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "stores owner delete" on public.stores for delete using (public.is_org_owner(organization_id));

create policy "store settings member access" on public.store_settings for all using (public.can_access_store(store_id)) with check (public.can_access_store(store_id));
create policy "store pages member access" on public.store_pages for all using (public.can_access_store(store_id)) with check (public.can_access_store(store_id));
create policy "store sections member access" on public.store_sections for all using (public.can_access_store(store_id)) with check (public.can_access_store(store_id));
create policy "categories member access" on public.categories for all using (public.can_access_store(store_id)) with check (public.can_access_store(store_id));
create policy "categories public read" on public.categories for select using (exists(select 1 from public.stores s where s.id = store_id and s.status = 'PUBLISHED'));

create policy "products member access" on public.products for all using (public.can_access_store(store_id)) with check (public.can_access_store(store_id));
create policy "products public published read" on public.products for select using (status = 'PUBLISHED' and exists(select 1 from public.stores s where s.id = store_id and s.status = 'PUBLISHED'));
create policy "variants member access" on public.product_variants for all using (exists(select 1 from public.products p where p.id = product_id and public.can_access_store(p.store_id))) with check (exists(select 1 from public.products p where p.id = product_id and public.can_access_store(p.store_id)));
create policy "variants public read" on public.product_variants for select using (exists(select 1 from public.products p join public.stores s on s.id = p.store_id where p.id = product_id and p.status = 'PUBLISHED' and s.status = 'PUBLISHED'));

create policy "customers merchant access" on public.customers for all using (public.can_access_store(store_id)) with check (public.can_access_store(store_id));
create policy "addresses merchant access" on public.customer_addresses for all using (exists(select 1 from public.customers c where c.id = customer_id and public.can_access_store(c.store_id))) with check (exists(select 1 from public.customers c where c.id = customer_id and public.can_access_store(c.store_id)));
create policy "orders merchant access" on public.orders for all using (public.can_access_store(store_id)) with check (public.can_access_store(store_id));
create policy "order items merchant access" on public.order_items for all using (exists(select 1 from public.orders o where o.id = order_id and public.can_access_store(o.store_id))) with check (exists(select 1 from public.orders o where o.id = order_id and public.can_access_store(o.store_id)));
create policy "payments merchant access" on public.payments for all using (public.can_access_store(store_id)) with check (public.can_access_store(store_id));

create policy "credits member read" on public.ai_credits for select using (public.is_org_member(organization_id));
create policy "ai generations user access" on public.ai_generations for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications own access" on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "files merchant access" on public.files for all using (owner_id = auth.uid() or public.can_access_store(store_id)) with check (owner_id = auth.uid());
create policy "analytics merchant access" on public.analytics_daily for all using (public.can_access_store(store_id)) with check (public.can_access_store(store_id));
create policy "domains merchant access" on public.domains for all using (public.can_access_store(store_id)) with check (public.can_access_store(store_id));

-- Public checkout is a narrow RPC: it validates the published store/product server-side,
-- creates/updates only the relevant customer, increments an atomic order counter and creates a notification.
create or replace function public.create_public_order(
  p_store_slug text,
  p_product_id uuid,
  p_quantity integer,
  p_name text,
  p_phone text,
  p_whatsapp text default null,
  p_email text default null,
  p_country text default null,
  p_city text default null,
  p_district text default null,
  p_address text default null,
  p_notes text default null
) returns table(order_number text, total numeric, currency text)
language plpgsql security definer set search_path = public as $$
declare
  v_store public.stores%rowtype;
  v_product public.products%rowtype;
  v_customer_id uuid;
  v_order_id uuid;
  v_counter integer;
  v_total numeric(12,2);
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 20 then raise exception 'Quantité invalide'; end if;
  if coalesce(char_length(trim(p_name)), 0) < 2 or coalesce(char_length(trim(p_phone)), 0) < 6 then raise exception 'Informations client invalides'; end if;
  if coalesce(char_length(trim(p_country)), 0) < 2 or coalesce(char_length(trim(p_city)), 0) < 2 then raise exception 'Adresse de livraison incomplète'; end if;

  select * into v_store from public.stores where slug = p_store_slug and status = 'PUBLISHED' for update;
  if not found then raise exception 'Cette boutique n’est pas disponible'; end if;
  select * into v_product from public.products where id = p_product_id and store_id = v_store.id and status = 'PUBLISHED';
  if not found then raise exception 'Ce produit n’est plus disponible'; end if;

  v_total := v_product.price * p_quantity;
  insert into public.customers(store_id, name, phone, whatsapp, email, order_count, total_spent, last_order_at)
  values (v_store.id, trim(p_name), trim(p_phone), nullif(trim(p_whatsapp), ''), nullif(trim(p_email), ''), 1, v_total, now())
  on conflict(store_id, phone) do update set
    name = excluded.name,
    whatsapp = coalesce(excluded.whatsapp, public.customers.whatsapp),
    email = coalesce(excluded.email, public.customers.email),
    order_count = public.customers.order_count + 1,
    total_spent = public.customers.total_spent + excluded.total_spent,
    last_order_at = now()
  returning id into v_customer_id;

  update public.stores set order_sequence = order_sequence + 1 where id = v_store.id returning order_sequence into v_counter;
  insert into public.orders(store_id, customer_id, number, total, quantity, product_id, product_name, currency, delivery, customer_note)
  values (v_store.id, v_customer_id, 'ZV-' || lpad(v_counter::text, 4, '0'), v_total, p_quantity, v_product.id, v_product.name, v_store.currency,
    jsonb_build_object('country', trim(p_country), 'city', trim(p_city), 'district', nullif(trim(p_district), ''), 'address', nullif(trim(p_address), ''), 'notes', nullif(trim(p_notes), '')), nullif(trim(p_notes), ''))
  returning id into v_order_id;
  insert into public.order_items(order_id, product_id, title, quantity, unit_price, total, snapshot)
  values (v_order_id, v_product.id, v_product.name, p_quantity, v_product.price, v_total, jsonb_build_object('slug', v_product.slug));
  insert into public.notifications(store_id, user_id, notification_type, title, body, data)
  values (v_store.id, v_store.owner_id, 'ORDER', 'Nouvelle commande reçue', 'ZV-' || lpad(v_counter::text, 4, '0') || ' · ' || trim(p_name) || ' · ' || v_total::text || ' ' || v_store.currency, jsonb_build_object('order_id', v_order_id));
  return query select 'ZV-' || lpad(v_counter::text, 4, '0'), v_total, v_store.currency;
end;
$$;
grant execute on function public.create_public_order(text, uuid, integer, text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- Store assets: publicly readable storefront media, but uploads/deletes remain owner-bound.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-assets', 'store-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies live outside the `public` schema, so remove any legacy versions before creating them.
drop policy if exists "store assets public read" on storage.objects;
drop policy if exists "store assets user upload" on storage.objects;
drop policy if exists "store assets user update" on storage.objects;
drop policy if exists "store assets user delete" on storage.objects;
create policy "store assets public read" on storage.objects for select using (bucket_id = 'store-assets');
-- `storage.objects.owner_id` is text in this Supabase Storage schema, while auth.uid() is UUID.
-- Compare their text representations so this is compatible with the current Storage schema.
create policy "store assets user upload" on storage.objects for insert to authenticated with check (bucket_id = 'store-assets' and owner_id::text = (select auth.uid()::text));
create policy "store assets user update" on storage.objects for update to authenticated using (bucket_id = 'store-assets' and owner_id::text = (select auth.uid()::text)) with check (bucket_id = 'store-assets' and owner_id::text = (select auth.uid()::text));
create policy "store assets user delete" on storage.objects for delete to authenticated using (bucket_id = 'store-assets' and owner_id::text = (select auth.uid()::text));

commit;
