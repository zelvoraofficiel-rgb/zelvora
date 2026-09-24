# Audit initial et fondation technique — Zelvora

_Date de l’audit : 24 septembre 2026._

## Résultat de l’analyse initiale

| Élément demandé | Constat initial | Décision appliquée |
|---|---|---|
| Architecture existante | Le dossier `/home/user` était vide : aucun manifeste, source, README ou configuration. | Création d’un monorepo applicatif minimal, sans écraser d’existant. |
| Stack | Aucune stack détectée. Node.js 20.20.2 et npm 10.8.2 sont disponibles. | Next.js 16, TypeScript strict, React 19, Tailwind CSS 3, Prisma 6. |
| Base de données | Aucun `DATABASE_URL`, aucun serveur / migration / schéma préexistant. | Schéma PostgreSQL Prisma préparé et validé ; adaptateur JSON de développement explicitement temporaire. |
| Authentification | Aucun fournisseur ni secrets d’authentification. | Credentials email / mot de passe fonctionnels pour le MVP local ; `scrypt`, cookie HTTP-only signé. Google est différé jusqu’aux clés OAuth. |
| Stockage | Aucun bucket, endpoint S3 ou clé de stockage. | Upload d’images local contrôlé pour le développement, contrat d’environnement S3 pour la production. |
| Variables d’environnement | Aucune variable Zelvora disponible. | `.env.example` sans secrets et liste complète des variables nécessaires. |
| Fonctionnalités existantes | Aucune. | Le développement commence uniquement par le chemin critique MVP. |

## Stack retenue

- **Application web et API** : Next.js 16 (App Router), TypeScript strict.
- **UI** : Tailwind CSS, composants natifs légers, responsive mobile-first.
- **Persistance cible** : PostgreSQL + Prisma.
- **Auth MVP** : credentials internes, hash `scrypt`, HMAC SHA-256 pour la session ; Google ensuite.
- **IA** : interface `ProductAnalysisProvider` dans `lib/ai.ts`, qui permet de changer de fournisseur sans toucher au parcours métier.
- **Paiement MVP** : paiement à la livraison. La table `Payment` et les statuts sont prêts pour l’interface `PaymentProvider` à ajouter avant Mobile Money / carte.
- **Fichiers** : upload validé localement en dev ; future implémentation S3 compatible.

## Modèle multi-tenant cible

```text
User → OrganizationMember → Organization → Store
                                        └→ products / customers / orders / settings / files
```

Le schéma porte les clés organisation / boutique dans les ressources sensibles et les index d’accès. Les routes actuelles vérifient `user → organization → store` côté serveur ; aucun `storeId` fourni par le client n’est utilisé pour contourner cette vérification.

## Schéma de données préparé

`prisma/schema.prisma` couvre les familles demandées : utilisateurs, organisations, boutiques et réglages, pages et sections, catalogue et variantes, clients et adresses, commandes et paiements, plans et abonnements, générations / crédits IA, notifications, fichiers, analytics et domaines, affiliation, coupons et audit logs.

Le schéma est syntaxiquement et relationnellement validé avec Prisma. Il n’a pas été migré, car aucune instance PostgreSQL ni valeur `DATABASE_URL` n’a été fournie. Lancer une migration sans base cible aurait été une fausse vérification.

## Garde-fous sécurité déjà appliqués

- mots de passe hashés avec sel `scrypt` ;
- cookies `HttpOnly`, `SameSite=Lax`, `Secure` en production ;
- validation Zod sur les charges API ;
- contrôle d’origine pour les mutations ;
- rate limiter en mémoire de développement ;
- tailles et MIME des uploads vérifiés côté serveur ;
- import de lien HTTPS, sans redirection, avec filtrage de réseaux privés avant extraction de métadonnées ;
- aucune clé, aucun token ni credential écrit dans le code ;
- vérification d’appartenance côté serveur pour boutiques et commandes.

Le rate limiting en mémoire et le stockage JSON sont uniquement adaptés à un environnement de développement à une instance. Ils devront devenir respectivement Redis / KV distribué et PostgreSQL avant déploiement.
