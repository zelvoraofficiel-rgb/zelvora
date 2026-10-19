begin;
drop function if exists public.create_public_order(text,uuid,integer,text,text,text,text,text,text,text,text,text);
create function public.create_public_order(p_store_slug text,p_product_id uuid,p_quantity integer,p_name text,p_phone text,p_whatsapp text default null,p_email text default null,p_country text default null,p_city text default null,p_district text default null,p_address text default null,p_notes text default null,p_custom_fields jsonb default '{}'::jsonb)
returns table(order_number text,total numeric,currency text) language plpgsql security definer set search_path=public as $$
declare v_store public.stores%rowtype;v_product public.products%rowtype;v_customer_id uuid;v_order_id uuid;v_counter integer;v_total numeric(12,2);begin
if p_quantity is null or p_quantity<1 or p_quantity>20 then raise exception 'Quantité invalide';end if;
if coalesce(char_length(trim(p_name)),0)<2 or coalesce(char_length(trim(p_phone)),0)<6 then raise exception 'Informations client invalides';end if;
if coalesce(char_length(trim(p_country)),0)<2 or coalesce(char_length(trim(p_city)),0)<2 then raise exception 'Adresse de livraison incomplète';end if;
select * into v_store from public.stores where slug=p_store_slug and status='PUBLISHED' for update;if not found then raise exception 'Cette boutique n’est pas disponible';end if;
select * into v_product from public.products where id=p_product_id and store_id=v_store.id and status='PUBLISHED';if not found then raise exception 'Ce produit n’est plus disponible';end if;
v_total:=v_product.price*p_quantity;
insert into public.customers(store_id,name,phone,whatsapp,email,order_count,total_spent,last_order_at)values(v_store.id,trim(p_name),trim(p_phone),nullif(trim(p_whatsapp),''),nullif(trim(p_email),''),1,v_total,now())on conflict(store_id,phone)do update set name=excluded.name,whatsapp=coalesce(excluded.whatsapp,public.customers.whatsapp),email=coalesce(excluded.email,public.customers.email),order_count=public.customers.order_count+1,total_spent=public.customers.total_spent+excluded.total_spent,last_order_at=now() returning id into v_customer_id;
update public.stores set order_sequence=order_sequence+1 where id=v_store.id returning order_sequence into v_counter;
insert into public.orders(store_id,customer_id,number,total,quantity,product_id,product_name,currency,delivery,customer_note)values(v_store.id,v_customer_id,'ZV-'||lpad(v_counter::text,4,'0'),v_total,p_quantity,v_product.id,v_product.name,v_store.currency,jsonb_build_object('country',trim(p_country),'city',trim(p_city),'district',nullif(trim(p_district),''),'address',nullif(trim(p_address),''),'notes',nullif(trim(p_notes),''),'customFields',coalesce(p_custom_fields,'{}'::jsonb)),nullif(trim(p_notes),''))returning id into v_order_id;
insert into public.order_items(order_id,product_id,title,quantity,unit_price,total,snapshot)values(v_order_id,v_product.id,v_product.name,p_quantity,v_product.price,v_total,jsonb_build_object('slug',v_product.slug));
insert into public.notifications(store_id,user_id,notification_type,title,body,data)values(v_store.id,v_store.owner_id,'ORDER','Nouvelle commande reçue','ZV-'||lpad(v_counter::text,4,'0')||' · '||trim(p_name)||' · '||v_total::text||' '||v_store.currency,jsonb_build_object('order_id',v_order_id));
return query select 'ZV-'||lpad(v_counter::text,4,'0'),v_total,v_store.currency;end$$;
grant execute on function public.create_public_order(text,uuid,integer,text,text,text,text,text,text,text,text,text,jsonb) to anon,authenticated;
notify pgrst,'reload schema';commit;
