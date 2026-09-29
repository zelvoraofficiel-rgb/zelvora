-- Zelvora platform administration. Apply after 0003.
begin;
-- Admin read access needed by the back-office. Mutations remain limited to RPCs below.
create policy "platform admin reads profiles" on public.profiles for select to authenticated using(public.is_platform_admin());
create policy "platform admin reads organizations" on public.organizations for select to authenticated using(public.is_platform_admin());
create policy "platform admin reads memberships" on public.organization_members for select to authenticated using(public.is_platform_admin());
create policy "platform admin reads subscriptions" on public.subscriptions for select to authenticated using(public.is_platform_admin());
create policy "platform admin reads plans" on public.plans for select to authenticated using(public.is_platform_admin());
create policy "platform admin reads stores" on public.stores for select to authenticated using(public.is_platform_admin());

create or replace function public.admin_set_user_status(p_user_id uuid,p_status text,p_reason text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare old_status text; begin
 if not public.is_platform_admin() then raise exception 'Accès administrateur requis'; end if;
 if p_status not in ('ACTIVE','SUSPENDED') then raise exception 'Statut invalide'; end if;
 if p_user_id=auth.uid() and p_status='SUSPENDED' then raise exception 'Vous ne pouvez pas suspendre votre propre compte'; end if;
 select status into old_status from public.profiles where id=p_user_id for update;
 if not found then raise exception 'Utilisateur introuvable'; end if;
 update public.profiles set status=p_status,updated_at=now() where id=p_user_id;
 insert into public.audit_logs(user_id,action,entity_type,entity_id,metadata) values(auth.uid(),'ADMIN_USER_STATUS','PROFILE',p_user_id,jsonb_build_object('old_status',old_status,'new_status',p_status,'reason',p_reason));
 return jsonb_build_object('id',p_user_id,'status',p_status);
end $$;
grant execute on function public.admin_set_user_status(uuid,text,text) to authenticated;
notify pgrst,'reload schema';
commit;
