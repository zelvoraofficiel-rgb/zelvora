begin;
update public.plans set price_monthly=15000,price_yearly=144000 where slug='pro';
update public.plans set price_monthly=30000,price_yearly=288000 where slug='business';
alter table public.subscription_payment_requests add column if not exists billing_interval text not null default 'MONTHLY';
alter table public.subscription_payment_requests drop constraint if exists subscription_payment_requests_billing_interval_check;
alter table public.subscription_payment_requests add constraint subscription_payment_requests_billing_interval_check check(billing_interval in('MONTHLY','YEARLY'));
create or replace function public.handle_new_organization() returns trigger language plpgsql security definer set search_path=public as $$begin
 insert into public.organization_members(organization_id,user_id,role)values(new.id,new.created_by_id,'OWNER')on conflict do nothing;
 insert into public.ai_credits(organization_id,balance,monthly_limit)values(new.id,5,5)on conflict do nothing;
 insert into public.subscriptions(organization_id,plan_id,owner_user_id,status,billing_interval,trial_ends_at,current_period_end)
 select new.id,p.id,new.created_by_id,'TRIAL','MONTHLY',now()+interval '1 day',now()+interval '1 day' from public.plans p where p.slug='free' on conflict do nothing;
 return new;end$$;
update public.subscriptions set trial_ends_at=coalesce(trial_ends_at,created_at+interval '1 day'),current_period_end=coalesce(current_period_end,created_at+interval '1 day') where status='TRIAL';
update public.subscriptions set status='EXPIRED',updated_at=now() where status='TRIAL' and coalesce(trial_ends_at,current_period_end)<now();
create or replace function public.review_manual_payment(p_request_id uuid,p_action text,p_reason text default null)
returns jsonb language plpgsql security definer set search_path=public as $$declare r public.subscription_payment_requests;v_sub uuid;v_end timestamptz;begin
 if not public.is_platform_admin() then raise exception 'Accès administrateur requis';end if;
 if p_action not in('CONFIRMED','REJECTED')then raise exception 'Action invalide';end if;
 select * into r from public.subscription_payment_requests where id=p_request_id for update;if not found then raise exception 'Demande introuvable';end if;
 if r.status<>'PENDING' then raise exception 'Cette demande a déjà été traitée';end if;
 if p_action='REJECTED' and coalesce(trim(p_reason),'')='' then raise exception 'Le motif du refus est obligatoire';end if;
 update public.subscription_payment_requests set status=p_action,rejection_reason=case when p_action='REJECTED' then trim(p_reason) end,reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=r.id;
 insert into public.subscription_payment_history(request_id,old_status,new_status,actor_id,reason)values(r.id,'PENDING',p_action,auth.uid(),p_reason);
 if p_action='CONFIRMED' then
  update public.subscriptions set status='EXPIRED',updated_at=now() where organization_id=r.organization_id and status in('TRIAL','ACTIVE','PAST_DUE');
  v_end=case when r.billing_interval='YEARLY' then now()+interval '1 year' else now()+interval '1 month' end;
  insert into public.subscriptions(organization_id,plan_id,owner_user_id,status,billing_interval,provider,provider_reference,current_period_end)
  values(r.organization_id,r.plan_id,r.user_id,'ACTIVE',r.billing_interval,'MANUAL',r.id::text,v_end)returning id into v_sub;
 end if;
 return jsonb_build_object('request_id',r.id,'status',p_action,'subscription_id',v_sub,'billing_interval',r.billing_interval,'current_period_end',v_end);end$$;
grant execute on function public.review_manual_payment(uuid,text,text) to authenticated;
notify pgrst,'reload schema';commit;
