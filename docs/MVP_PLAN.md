# Plan d’implémentation Zelvora

## Principe de priorité

La valeur à livrer avant toute extension est :

```text
Inscription → Import produit → Suggestion vérifiable → Boutique → Publication
→ Commande → Notification → Gestion de commande
```

La fondation actuelle couvre ce trajet de bout en bout. Elle ne représente pas encore le SaaS complet décrit dans la vision ; les fonctions non présentes ne sont pas affichées comme actives.

## Incrément livré : Fondation + chemin critique

| Domaine | Réalisé | État |
|---|---|---|
| Auth | inscription, connexion API, logout API, session | Fonctionnel en développement |
| Organisations / magasins | une organisation créée à l’inscription, une boutique gratuite par organisation | Fonctionnel avec adaptateur local |
| Import | URL HTTPS (métadonnées publiques), image uploadée, saisie manuelle | Fonctionnel ; analyse IA externe non branchée |
| Sûreté IA | informations manquantes signalées, contenu modifiable, pas de promesses inventées | Fonctionnel |
| Génération boutique | identité, couleur, accroche, produit initial, brouillon et publication | Fonctionnel |
| Storefront | landing, produit, checkout mobile et COD | Fonctionnel |
| Commandes / clients | création, métriques, notification, mise à jour de statut | Fonctionnel |
| Schéma SaaS cible | PostgreSQL / Prisma, plans, IA, affiliation, audit | Préparé et validé, non migré |

## Incrément 2 — Production data & auth

1. Déployer PostgreSQL et ajouter `@prisma/client`.
2. Remplacer l’adaptateur JSON par des repositories Prisma transactionnels.
3. Migrations, seed du plan gratuit, tests d’isolation organisationnelle et politiques de rétention.
4. Email verification, reset password, OAuth Google et sessions persistantes / révocables.
5. S3 compatible, antivirus / analyse de fichiers et CDN d’images.
6. Rate limiting Redis / KV, logs structurés, alertes et audit logs actifs.

**Critère de sortie :** aucun état commercial n’est conservé dans le système local de développement ; toutes les limites sont contrôlées au backend PostgreSQL.

## Incrément 3 — Commerce et éditeur

1. CRUD complet produits, variantes, catégories, stock, publication et archivage.
2. Éditeur de sections : accueil, hero, catalogue, FAQ, témoignages fournis, footer ; drag-and-drop accessible.
3. Panier et checkout multi-produits ; livraison configurée par zone.
4. Pages légales, SEO, sitemap, recherche et catalogue.
5. Dashboard / analytics avec filtres réels et exports clients.

## Incrément 4 — IA et contenu

1. Fournisseur IA approuvé derrière `ProductAnalysisProvider` ; limites, crédits et `ai_generations` persistés.
2. Analyse image via fournisseur vision et extraction de données depuis URL via worker sécurisé.
3. Actions éditoriales : réécrire, raccourcir, CTA, FAQ, WhatsApp et Facebook, chacune avec aperçu / accepter / refuser.
4. AI Studio (background removal, visuels) via jobs asynchrones, fichiers S3 et coût en crédits.
5. Assistant Business contextualisé, avec droits tenant stricts et rétention claire.

**Règle constante :** toute sortie IA reste éditable et chaque incertitude critique est explicitement signalée.

## Incrément 5 — Paiements, abonnements et notifications

1. Interface `PaymentProvider` et webhooks signés, idempotents.
2. Mobile Money, carte et prestataires locaux, après choix pays / fournisseurs ; COD conserve sa propre logique de confirmation.
3. Plans depuis `plans`, usage / limites côté backend, essais, coupons et portail billing.
4. Notifications email transactionnelles d’abord, puis WhatsApp / SMS derrière des adaptateurs dédiés.

## Incrément 6 — Affiliation et administration

1. Attribution lien / cookie, clics, leads, conversions uniquement après paiement confirmé.
2. Commissions récurrentes, reversements et retraits sous validation administrative.
3. Portail affilié : lien, code, QR, éléments créatifs validés et historique.
4. Back-office admin avec RBAC, anti-fraude, support, modération et audit logs.

## Décisions à obtenir avant les intégrations externes

- pays de lancement exacts et devise(s) ;
- fournisseurs Mobile Money / cartes prioritaires par pays ;
- fournisseur IA et budget / règles de conservation des prompts et images ;
- fournisseur email, WhatsApp et SMS ;
- hébergeur PostgreSQL, stockage et région de données ;
- politiques livraison, retours, CGU et confidentialité ;
- plans, limites et prix validés par le produit (sans prix hardcodés frontend).
