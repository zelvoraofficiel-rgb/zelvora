-- Public storefronts need to read non-secret display and pixel settings.
-- Never store access tokens or API secrets in store_settings JSON.
drop policy if exists "published store settings public read" on public.store_settings;
create policy "published store settings public read"
on public.store_settings for select
to anon, authenticated
using (exists(select 1 from public.stores s where s.id=store_id and s.status='PUBLISHED'));
notify pgrst, 'reload schema';
