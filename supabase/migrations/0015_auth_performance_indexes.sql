begin;
-- Indexes matched to the authenticated dashboard queries used by Zelvora.
create index if not exists orders_store_created_idx on public.orders(store_id,created_at desc);
create index if not exists customers_store_last_order_idx on public.customers(store_id,last_order_at desc);
create index if not exists products_store_created_idx on public.products(store_id,created_at desc);
create index if not exists notifications_store_unread_idx on public.notifications(store_id,created_at desc) where read_at is null;
create index if not exists subscriptions_org_created_idx on public.subscriptions(organization_id,created_at desc);
create index if not exists categories_store_name_idx on public.categories(store_id,name);

create or replace function public.get_store_dashboard_metrics(p_store_id uuid,p_since date default (current_date-29))
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare result jsonb;
begin
 if not public.can_access_store(p_store_id) then raise exception 'Accès refusé'; end if;
 select jsonb_build_object(
  'orders',count(*),
  'revenue',coalesce(sum(total) filter(where status<>'CANCELLED'),0),
  'averageOrder',coalesce(avg(total) filter(where status<>'CANCELLED'),0),
  'pending',count(*) filter(where status in('NEW','CONFIRMED','PREPARING','SHIPPED')),
  'delivered',count(*) filter(where status='DELIVERED')
 ) into result from public.orders where store_id=p_store_id;
 return result||jsonb_build_object(
  'visits',coalesce((select sum(visitors) from public.analytics_daily where store_id=p_store_id and day>=p_since),0),
  'customers',(select count(*) from public.customers where store_id=p_store_id)
 );
end$$;
grant execute on function public.get_store_dashboard_metrics(uuid,date) to authenticated;
notify pgrst,'reload schema';
commit;
-- Rollback: drop function public.get_store_dashboard_metrics(uuid,date); then drop the six indexes above.
