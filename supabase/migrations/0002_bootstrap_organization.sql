-- Zelvora recovery migration: create/read the current merchant organization through
-- a narrowly scoped SECURITY DEFINER RPC. Run once in Supabase SQL Editor.
-- It avoids relying on a client-side direct INSERT during first-login bootstrapping.

begin;

create or replace function public.bootstrap_current_organization()
returns table(organization_id uuid, organization_name text, organization_slug text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text;
  v_organization public.organizations%rowtype;
begin
  if v_user_id is null then
    raise exception 'Utilisateur non authentifié.' using errcode = '28000';
  end if;

  select o.* into v_organization
  from public.organization_members m
  join public.organizations o on o.id = m.organization_id
  where m.user_id = v_user_id
  order by o.created_at asc
  limit 1;

  if found then
    return query select v_organization.id, v_organization.name, v_organization.slug;
    return;
  end if;

  select coalesce(nullif(trim(name), ''), 'Ma') into v_name
  from public.profiles
  where id = v_user_id;

  if v_name is null then
    raise exception 'Profil marchand introuvable.' using errcode = 'P0002';
  end if;

  insert into public.organizations (name, slug, created_by_id)
  values (
    v_name || ' entreprise',
    'boutique-' || replace(gen_random_uuid()::text, '-', '')::text,
    v_user_id
  )
  returning * into v_organization;

  -- The existing on_organization_created trigger adds the owner membership,
  -- free subscription and AI credits atomically in this transaction.
  return query select v_organization.id, v_organization.name, v_organization.slug;
end;
$$;

grant execute on function public.bootstrap_current_organization() to authenticated;

commit;
