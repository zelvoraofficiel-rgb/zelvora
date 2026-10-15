begin;
create table if not exists public.store_testimonials(
 id uuid primary key default gen_random_uuid(),
 store_id uuid not null references public.stores(id) on delete cascade,
 product_id uuid references public.products(id) on delete set null,
 customer_name text not null check(char_length(trim(customer_name)) between 2 and 80),
 body text not null check(char_length(trim(body)) between 10 and 800),
 rating smallint not null check(rating between 1 and 5),
 status text not null default 'DRAFT' check(status in('DRAFT','PUBLISHED')),
 verified_purchase boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists store_testimonials_store_idx on public.store_testimonials(store_id,status,created_at desc);
alter table public.store_testimonials enable row level security;
drop policy if exists testimonials_public_read on public.store_testimonials;
create policy testimonials_public_read on public.store_testimonials for select using((status='PUBLISHED' and exists(select 1 from public.stores s where s.id=store_id and s.status='PUBLISHED')) or public.can_access_store(store_id));
drop policy if exists testimonials_merchant_insert on public.store_testimonials;
create policy testimonials_merchant_insert on public.store_testimonials for insert with check(public.can_access_store(store_id));
drop policy if exists testimonials_merchant_update on public.store_testimonials;
create policy testimonials_merchant_update on public.store_testimonials for update using(public.can_access_store(store_id)) with check(public.can_access_store(store_id));
drop policy if exists testimonials_merchant_delete on public.store_testimonials;
create policy testimonials_merchant_delete on public.store_testimonials for delete using(public.can_access_store(store_id));
notify pgrst,'reload schema';
commit;
