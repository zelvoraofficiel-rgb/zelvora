# Zelvora — AI Commerce Builder

> **Ton produit. Ton image. Ton lien. Zelvora crée ta boutique.**

Zelvora est une fondation MVP pour permettre à un e-commerçant de créer une boutique à partir d’un lien, d’une image ou d’informations saisies, de la vérifier, de la publier et de recevoir une commande.

## État actuel : fondation MVP fonctionnelle

Le parcours réellement relié est :

```text
Inscription → produit (lien / image / manuel) → suggestion sûre à vérifier
→ boutique brouillon → publication → checkout COD → commande → notification dashboard
```

- **Compte email / mot de passe** : hash `scrypt`, cookie de session signé HTTP-only, contrôle d’origine et limitation simple des tentatives.
- **Import de lien** : extraction limitée aux métadonnées HTML publiques d’une URL HTTPS, sans redirection, avec filtrage SSRF de base. Si rien n’est trouvé, la donnée est explicitement marquée à compléter.
- **Import d’image** : JPG, PNG et WEBP, taille maximale de 5 Mo, avec validation serveur. En développement, les fichiers sont écrits dans `public/uploads`.
- **Suggestion produit** : contenu structuré et modifiable, sans invention silencieuse de caractéristiques, garanties, certifications ou performances. Le provider `demo` ne prétend pas être un modèle IA externe.
- **Boutique publique** : page produit responsive, commande à la livraison, création de client, de commande et de notification marchand.
- **Espace marchand** : chiffres principaux, commandes, notifications et changement de statut de commande.
- **Isolation** : les routes marchandes vérifient côté serveur l’appartenance à l’organisation / boutique avant toute lecture ou mise à jour.

## Démarrer localement

```bash
cp .env.example .env.local
npm install
npm run dev
```

Ouvrir `http://localhost:3000`.

### Variables d’environnement

- `AUTH_SECRET` : obligatoire en production. Générer une valeur aléatoire longue (au minimum 32 caractères).
- `DATABASE_URL` : PostgreSQL requis pour l’adaptateur de production Prisma et les migrations.
- `AI_PROVIDER` et clé du fournisseur : prévus pour brancher un vrai fournisseur IA derrière `lib/ai.ts`.
- les variables `S3_*` : prévues pour migrer les uploads vers un stockage S3 compatible.

Ne mettez jamais de clés dans le frontend ni dans Git.

## Supabase actif : Auth, PostgreSQL et Storage

Supabase est maintenant le provider actif (`ZELVORA_DATA_PROVIDER=supabase`) :

- les inscriptions et connexions utilisent **Supabase Auth** ;
- les boutiques, produits, commandes, clients et notifications utilisent PostgreSQL via les routes serveur ;
- l’accès aux lignes est contrôlé par les politiques **RLS** de la migration `0001_zelvora_core.sql` ;
- les images sont envoyées dans le bucket public `store-assets` ;
- le checkout public passe par la RPC étroite et sécurisée `create_public_order`, plutôt que de donner un accès anonyme aux tables de commandes.

Le fichier local `lib/db.ts` reste un fallback de développement lorsque `ZELVORA_DATA_PROVIDER=local`. Il ne doit pas être utilisé en production.

Le schéma Prisma reste dans [`prisma/schema.prisma`](prisma/schema.prisma) comme modèle cible étendu. Avant un déploiement commercial, il reste à :

1. configurer SMTP, confirmation email et réinitialisation de mot de passe dans Supabase Auth ;
2. ajouter un renouvellement de session SSR / middleware Supabase ;
3. remplacer le rate limiting en mémoire par Redis / KV ;
4. ajouter un fournisseur IA réel dans `lib/ai.ts`, ses crédits persistés et des jobs asynchrones ;
5. intégrer les Payment Providers, Mobile Money et webhooks idempotents ;
6. exécuter une revue sécurité, des sauvegardes, de l’observabilité et des tests RLS automatisés.

## Vérifications exécutées

```bash
npm run typecheck
npm run build
DATABASE_URL='postgresql://…' npm run db:validate
```

Le build Next.js et la validation Prisma passent. Un test de fumée a aussi vérifié le flux API : inscription → analyse → création / publication d’une boutique → commande → métriques et notification. `npm audit --omit=dev` ne remonte aucune vulnérabilité de production au moment de cette fondation.

## Documentation

- [`docs/FOUNDATION_AUDIT.md`](docs/FOUNDATION_AUDIT.md) — constat de l’architecture initiale et décisions.
- [`docs/MVP_PLAN.md`](docs/MVP_PLAN.md) — plan de livraison par phases, limites et prochains incréments.
- [`prisma/schema.prisma`](prisma/schema.prisma) — modèle de données cible.

## Déploiement Cloudflare

Le bundle de déploiement utilise **Cloudflare Workers avec OpenNext**, et non une exportation Pages statique, afin de préserver les routes serveur, l’authentification et le checkout. Consultez [`CLOUDFLARE_DEPLOY.md`](CLOUDFLARE_DEPLOY.md) et utilisez `npm run cf:build` / `npm run cf:deploy`.
