# Activer Supabase pour Zelvora

La configuration URL + clé publishable a été vérifiée depuis le projet. La clé publishable est prévue pour les clients web ; elle n’accorde pas un accès administratif lorsque les politiques RLS sont actives. Elle a été enregistrée seulement dans `.env.local`, qui est ignoré par Git.

## 1. Réinitialiser l’ancienne base (destructif)

Votre capture indique une ancienne structure incompatible : le code `42703` signifie que la colonne `organization_id` attendue n’existe pas sur une table déjà présente. Le script principal est transactionnel, donc son échec a annulé ses propres changements ; l’ancienne structure reste toutefois en place.

1. Vérifiez que vous êtes dans **le bon projet Supabase** — la capture montre `main / PRODUCTION`.
2. Si vous devez conserver quoi que ce soit, exportez-le avant de continuer.
3. Exécutez intégralement [`supabase/migrations/0000_reset_before_zelvora.sql`](../supabase/migrations/0000_reset_before_zelvora.sql) dans **SQL Editor**.

Ce reset efface les objets `public` et les comptes finaux dans `auth.users`. Il ne supprime pas votre compte Dashboard Supabase. Supabase bloque volontairement la suppression directe des fichiers/buckets Storage par SQL : si l’ancien projet contient des fichiers, supprimez-les depuis **Storage** dans le Dashboard, après le reset.

## 2. Exécuter la migration SQL Zelvora

1. Ouvrir le projet Supabase, puis **SQL Editor**.
2. Cliquer sur **New query**.
3. Copier l’intégralité de [`supabase/migrations/0001_zelvora_core.sql`](../supabase/migrations/0001_zelvora_core.sql).
4. Cliquer sur **Run** et vérifier que la transaction réussit sans erreur.

Le script crée :

- le profil lié à `auth.users` ;
- organisations et membres ;
- plans, abonnement gratuit et crédits IA initiaux ;
- boutiques, produits, clients, commandes, notifications et analytics ;
- pages, sections, catégories, variantes, fichiers, domaines, paiements ;
- index, triggers, RLS et une RPC sécurisée `create_public_order` ;
- le bucket `store-assets` pour JPG / PNG / WEBP de 5 Mo maximum.

La fonction de checkout est volontairement une RPC étroite : un visiteur anonyme ne reçoit jamais le droit général d’insérer ou de lire les commandes. Elle vérifie la boutique et le produit publiés, puis crée la commande et la notification côté base.

## 3. Configurer Supabase Auth

Dans **Authentication → Providers**, laisser **Email** activé. Dans **Authentication → URL Configuration** :

- ajouter l’URL de preview courante et l’URL de production aux *Redirect URLs* lorsque les liens de confirmation / réinitialisation seront activés ;
- définir le Site URL de production lors du déploiement ;
- décider si la confirmation email est obligatoire. Pour les tests de parcours rapide, elle peut être désactivée temporairement ; pour la production, elle doit être activée avec un SMTP configuré.

## 4. Ne pas transmettre de clé `service_role`

La migration ne nécessite pas de clé `service_role`. Ne mettez jamais cette clé dans le navigateur, un dépôt Git ou une variable `NEXT_PUBLIC_*`. Les opérations administratives devront passer par des routes serveur distinctes et journalisées.

## 5. Migration de récupération d’organisation

Exécutez également [`supabase/migrations/0002_bootstrap_organization.sql`](../supabase/migrations/0002_bootstrap_organization.sql). Elle ajoute une RPC sécurisée d’initialisation d’organisation pour les comptes Auth créés pendant le premier essai, tout en gardant le contrôle de l’identité sur `auth.uid()`.

## 6. Bascule applicative réalisée

La migration principale a été exécutée avec succès et l’application est maintenant réglée sur `ZELVORA_DATA_PROVIDER=supabase` :

- Supabase Auth gère inscription et connexion ;
- les routes marchandes utilisent PostgreSQL avec le JWT du marchand, donc les politiques RLS ;
- les uploads passent par `store-assets` ;
- les commandes publiques appellent la RPC `create_public_order`.

À compléter avant la mise en production commerciale : un SMTP Supabase, les URLs de redirection de production, le renouvellement de session SSR, le rate limiting distribué et les tests RLS.
