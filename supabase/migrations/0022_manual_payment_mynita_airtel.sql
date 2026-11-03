-- Réactive le paiement manuel PRO avec preuve, validé uniquement par un administrateur.
-- Les anciennes méthodes et demandes restent conservées pour l'historique.

insert into public.manual_payment_methods
  (code, name, account_number, account_holder, instructions, country_code, active, updated_at)
values
  ('mynita', 'Nita', '+227 91 23 95 22', 'Zelvora', 'Effectuez le dépôt, puis envoyez une photo ou un PDF lisible du reçu.', 'NE', true, now()),
  ('airtel_money', 'Airtel Money', '+227 88 72 92 17', 'Zelvora', 'Effectuez le transfert, puis envoyez une photo ou un PDF lisible du reçu.', 'NE', true, now())
on conflict (code) do update set
  name = excluded.name,
  account_number = excluded.account_number,
  account_holder = excluded.account_holder,
  instructions = excluded.instructions,
  country_code = excluded.country_code,
  active = true,
  updated_at = now();

-- Ne pas proposer les autres méthodes tant que leurs comptes de réception ne sont pas fournis.
update public.manual_payment_methods
set active = false, updated_at = now()
where country_code = 'NE' and code not in ('mynita', 'airtel_money');

-- Conserve les tarifs PRO demandés.
update public.plans
set price_monthly = 15000,
    price_yearly = 144000,
    currency = 'XOF',
    active = true,
    updated_at = now()
where slug = 'pro';
