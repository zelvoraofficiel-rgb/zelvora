# Publication Zelvora : GitHub → Cloudflare Workers → zelvora.net

> **Ne choisissez pas Cloudflare Pages.** Le projet Pages `zelvora.pages.dev` retourne une 404 parce qu’il ne contient pas de build statique : Zelvora utilise des routes serveur Next.js pour Supabase Auth, uploads, commandes et checkout. Importez le dépôt dans **Cloudflare Workers**.

## A. Créer le dépôt GitHub sans terminal

1. Téléchargez et décompressez `zelvora-github-cloudflare-workers.zip`.
2. Sur GitHub, cliquez sur **New repository**.
3. Nom du dépôt : `zelvora`.
4. Sélectionnez **Private**.
5. Ne cochez pas *Add a README*, *.gitignore* ou licence : les fichiers existent déjà.
6. Cliquez sur **Create repository**.
7. Dans le dépôt vide, cliquez sur **uploading an existing file**.
8. Glissez **le contenu du dossier décompressé** — pas le fichier ZIP et pas le dossier `node_modules`.
9. Cliquez sur **Commit changes** sur la branche `main`.

> Alternative recommandée si GitHub Desktop est installé : **File → Add local repository**, sélectionnez le dossier décompressé, puis **Publish repository** en privé.

## B. Importer le dépôt dans Cloudflare Workers

1. Ouvrez le tableau de bord Cloudflare.
2. Allez dans **Workers & Pages**.
3. Créez une application en choisissant **Workers** puis **Import a repository / Connect to Git**. Ne créez pas un projet Pages.
4. Autorisez Cloudflare à accéder à GitHub et sélectionnez le dépôt `zelvora`.
5. Branche de production : `main`.
6. Répertoire racine : laissez vide ou utilisez `/`.
7. Renseignez les paramètres de build :

| Champ Cloudflare | Valeur |
|---|---|
| Build command | `npm run cf:build` |
| Deploy command | `npx wrangler deploy` |
| Preview command | `npx wrangler preview` |
| Node.js version | `22` |

Cloudflare Workers Builds exécute la compilation, puis la commande de déploiement à chaque push sur `main`.

## C. Définir les variables Supabase

### Variables de build

Dans la section **Build variables / secrets**, ajoutez :

| Nom | Valeur |
|---|---|
| `NODE_VERSION` | `22` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publishable Supabase |
| `ZELVORA_DATA_PROVIDER` | `supabase` |

### Variables runtime

Après le premier déploiement, ouvrez **Workers & Pages → zelvora → Settings → Variables and Secrets** et ajoutez les trois variables Supabase ci-dessus aussi pour **Production**.

La clé publishable est autorisée. **Ne créez jamais** de variable `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` et n’ajoutez jamais de clé `service_role` dans GitHub ou Cloudflare.

## D. Déployer et connecter `zelvora.net`

1. Cliquez sur **Save and Deploy**.
2. Attendez que le log termine avec succès ; Cloudflare fournira une URL temporaire `*.workers.dev`.
3. Ouvrez **Workers & Pages → zelvora → Settings → Domains & Routes**.
4. Cliquez sur **Add Custom Domain**, puis entrez `zelvora.net`.
5. Ajoutez `www.zelvora.net` si souhaité.
6. Créez une règle de redirection dans **Rules → Redirect Rules** pour rediriger `www` vers le domaine principal (ou l’inverse).

Le domaine étant déjà géré par Cloudflare, DNS et SSL seront configurés automatiquement.

## E. Vérifier

Après le déploiement :

1. Ouvrez `https://zelvora.net`.
2. Créez ou connectez-vous à un compte marchand.
3. Créez une boutique, publiez-la, puis passez une commande test.
4. Vérifiez la commande dans le dashboard marchand et dans Supabase.

## Résolution du 404 actuel

`zelvora.pages.dev` est un projet **Pages** séparé et vide / non compilé. Il n’est pas la destination de ce bundle. Vous pouvez le conserver temporairement, mais il ne servira pas Zelvora. Une fois le Worker `zelvora` fonctionnel sur `zelvora.net`, vous pourrez supprimer ce projet Pages pour éviter toute confusion.
