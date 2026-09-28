# Plan de développement Zelvora

Ce document relie les modules demandés à des fonctionnalités réellement disponibles. Zelvora n’affiche pas de faux onglets pour les modules non encore connectés au backend.

## Phase 2 — Création de boutique

**Disponible dans le MVP**

- Onboarding de première boutique.
- Import de produit initial par lien, image ou saisie manuelle.
- Choix initial du thème Aura, Sahel ou Noir.
- Prévisualisation mobile de la boutique avant publication.
- Création de boutique et publication contrôlée depuis l’espace marchand.

**À poursuivre**

- Éditeur complet des pages et des sections de boutique.
- Personnalisation persistante de la mise en page au-delà des couleurs et de l’accroche.

## Phase 3 — IA produit

**Disponible dans le MVP**

- Onglet **Analyse IA** (`/analysis`).
- Téléversement d’image et import d’URL publique autorisée.
- Analyse structurée du produit.
- Création d’un produit vers le catalogue après validation humaine.
- Toutes les suggestions restent modifiables et les informations manquantes sont signalées.

**À poursuivre**

- Génération de copywriting avancée (variantes de fiches, FAQ, annonces) avec fournisseur IA configuré, crédits consommés côté serveur et contrôle éditorial explicite.

## Phase 4 — E-commerce

**Disponible dans le MVP**

- Onglet **Produits** (`/products`) : catalogue marchand avec ajout de produit et limite contrôlée côté serveur.
- Catalogue public multi-produits sur `/store/[slug]`.
- Checkout de commande à la livraison pour chaque produit.
- Onglet **Commandes** et tableau de bord.

**À poursuivre**

- Panier multi-produits.
- Espace Clients complet.
- Variantes, stock, catégories et paiement en ligne.

## Phase 5 — Notifications

**Disponible dans le MVP**

- Tableau de bord et notifications de commande en base.

**À poursuivre**

- Fournisseur email transactionnel configuré par variables d’environnement, modèles d’emails et journal de livraison.

## Phases 6 à 9

Plans/limites, IA Studio, assistant, publicité, affiliation et administration restent planifiés. Ils ne doivent être ajoutés à la navigation qu’avec des API, une base de données, des politiques RLS et des contrôles de sécurité réellement opérationnels.
