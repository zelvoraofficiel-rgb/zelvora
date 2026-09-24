# Déployer Zelvora sur Cloudflare avec le domaine `zelvora.net`

## Important : Workers, pas Pages statique

Zelvora contient des routes serveur Next.js (authentification, checkout, upload, Supabase/RLS et commandes). Une exportation statique Cloudflare Pages supprimerait ces fonctions.

Cette archive utilise donc **OpenNext + Cloudflare Workers**, la cible adaptée aux applications Next.js full-stack. Votre domaine déjà géré dans Cloudflare peut être relié directement au Worker : vous gardez Cloudflare pour l’hébergement et le SSL automatique.

## Pré-requis

- Compte Cloudflare qui contrôle `zelvora.net`.
- Node.js **22 ou plus récent** sur votre ordinateur ou dans votre pipeline CI.
- Le projet Supabase Zelvora et les migrations `0001` / `0002` déjà exécutées.

## Déploiement depuis votre ordinateur

1. Décompressez l’archive puis ouvrez le dossier dans un terminal.
2. Installez les dépendances :

   ```bash
   npm install
   ```

3. Connectez-vous à Cloudflare :

   ```bash
   npx wrangler login
   ```

4. Définissez les variables de build **dans ce terminal**. La clé Supabase fournie est une clé *publishable*, donc elle peut être une variable normale ; ne mettez jamais une clé `service_role` ici.

   **macOS / Linux**

   ```bash
   export NEXT_PUBLIC_SUPABASE_URL="https://VOTRE-PROJET.supabase.co"
   export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="VOTRE_CLE_PUBLISHABLE"
   export ZELVORA_DATA_PROVIDER="supabase"
   ```

   **Windows PowerShell**

   ```powershell
   $env:NEXT_PUBLIC_SUPABASE_URL="https://VOTRE-PROJET.supabase.co"
   $env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="VOTRE_CLE_PUBLISHABLE"
   $env:ZELVORA_DATA_PROVIDER="supabase"
   ```

5. Vérifiez le bundle Worker sans publication :

   ```bash
   npm run cf:build
   ```

6. Publiez le Worker :

   ```bash
   npm run cf:deploy
   ```

Cloudflare créera le Worker nommé `zelvora` et une URL `*.workers.dev` temporaire.

## Variables runtime dans Cloudflare

Dans **Workers & Pages → zelvora → Settings → Variables and Secrets**, ajoutez les mêmes valeurs pour l’environnement **Production** :

| Nom | Valeur |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publishable Supabase |
| `ZELVORA_DATA_PROVIDER` | `supabase` |

Les variables `NEXT_PUBLIC_*` doivent être disponibles à la construction **et** au runtime. Ne créez jamais de variable `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.

## Relier `zelvora.net`

Après le premier déploiement :

1. Ouvrez **Workers & Pages → zelvora → Settings → Domains & Routes**.
2. Cliquez sur **Add Custom Domain**.
3. Saisissez `zelvora.net`, puis confirmez.
4. Répétez avec `www.zelvora.net` si vous souhaitez que les deux adresses fonctionnent.
5. Cloudflare configure automatiquement le DNS et le certificat SSL puisque le domaine est déjà dans votre compte.
6. Définissez une redirection `www.zelvora.net` → `zelvora.net` ou l’inverse dans **Rules → Redirect Rules**.

> Si un projet Pages ou une route existante utilise déjà `zelvora.net`, retirez d’abord cette association pour éviter un conflit de domaine.

## Vérification après publication

- Ouvrir `https://zelvora.net`.
- Créer ou connecter un compte marchand.
- Créer une boutique depuis l’onboarding.
- Publier la boutique.
- Passer une commande test depuis la boutique publique.
- Vérifier la commande et la notification dans le dashboard.

## Commandes utiles

```bash
npm run dev          # développement Next.js local
npm run cf:build     # génère .open-next pour Cloudflare Worker
npm run cf:preview   # aperçu local dans le runtime Worker
npm run cf:deploy    # build + publication Cloudflare
```

## Sécurité

- `.env.local`, `.dev.vars`, `node_modules`, les builds et les données locales sont exclus de l’archive / Git.
- Les règles RLS Supabase restent la barrière de sécurité des données marchand.
- La clé `service_role` ne doit jamais être ajoutée à Cloudflare ni au navigateur.

## Déploiement GitHub automatique

Pour publier sans terminal local, consultez [`GITHUB_CLOUDFLARE_WORKERS.md`](GITHUB_CLOUDFLARE_WORKERS.md). Dans Cloudflare, importez le dépôt comme **Worker** avec `npm run cf:build` pour la compilation et `npx wrangler deploy` pour le déploiement — pas comme un projet Pages.
