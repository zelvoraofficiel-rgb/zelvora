begin;
-- Zelvora ne propose plus BUSINESS aux nouveaux abonnements.
-- Les abonnements BUSINESS historiques restent intacts jusqu'à leur expiration.
update public.plans set active=false,updated_at=now() where slug='business';
update public.plans set active=true,price_monthly=15000,price_yearly=144000,updated_at=now() where slug='pro';
notify pgrst,'reload schema';
commit;
