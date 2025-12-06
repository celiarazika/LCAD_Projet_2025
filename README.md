# Steam Games Database - Architecture 3-Tiers

Application web de recherche et gestion de jeux Steam avec architecture 3-tiers complète (Présentation, Métier, Données) et base de données MongoDB.

## Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Technologies](#technologies)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [API REST](#api-rest)
- [Structure du projet](#structure-du-projet)

## Fonctionnalités

### Recherche et Filtrage
- Recherche textuelle par titre ou tags
- Filtrage par genre
- Tri multi-critères (titre, score, prix, date, avis, popularité)
- Ordre ascendant/descendant
- Pagination (20 jeux par page)

### Gestion CRUD
- Ajouter un nouveau jeu
- Supprimer un jeu existant
- Persistance des données dans MongoDB

### Interface Utilisateur
- Images agrandies (240px × 135px)
- Statistiques en temps réel
- Design moderne et responsive

## Architecture

### Architecture 3-Tiers

```
Couche 1: PRÉSENTATION (Frontend)
├─ HTML/CSS/JavaScript
└─ Port 3000

Couche 2: MÉTIER (Business Logic)
├─ GameService.js
└─ Logique de filtrage, tri, validation

Couche 3: DONNÉES (Data Layer)
├─ GameDatabase.js
└─ MongoDB (~110 000 documents)
```

### Couches détaillées

**Couche 1: Présentation**
- Interface utilisateur et expérience utilisateur
- Technologies: HTML5, CSS3, JavaScript ES6+

**Couche 2: Métier**
- Classe: GameService
- Validation, filtrage, tri et statistiques

**Couche 3: Données**
- Classe: GameDatabase
- Connexion MongoDB et opérations CRUD

## Technologies

### Backend
- Node.js (v20.12.2)
- Express.js
- MongoDB (v7.0+)

### Frontend
- HTML5, CSS3, JavaScript ES6+
- Fetch API

### Outils
- JSONStream
- npm

## Installation

### Prérequis
1. Node.js (v20 ou supérieur)
2. MongoDB (v7.0 ou supérieur)

### Étapes

1. Cloner le projet
```powershell
git clone <url-du-repo>
cd LCAD_Projet_2025
```

2. Installer les dépendances
```powershell
npm install
```

3. Démarrer MongoDB
```powershell
Start-Service MongoDB
```

4. Importer les données
```powershell
node scripts/migrate_to_mongodb.js
```

5. Démarrer le serveur
```powershell
node server.js
```

6. Ouvrir http://localhost:3000

## Utilisation

### Interface de recherche
- Tapez un titre ou un tag
- Sélectionnez un genre
- Choisissez un critère de tri
- Naviguez avec la pagination

### Interface d'administration
- Cliquez sur "Mode Admin"
- Ajouter ou supprimer des jeux

### Statistiques
Affichage en temps réel des informations globales

## API REST

- `GET /api/games` - Rechercher et filtrer les jeux
- `GET /api/games/:id` - Détails d'un jeu
- `POST /api/games` - Ajouter un jeu
- `DELETE /api/games/:id` - Supprimer un jeu
- `GET /api/stats` - Statistiques globales
- `GET /api/genres` - Liste des genres

## Auteur

Celia - M2 DSI - LCAD 2025

