# 🎮 Steam Games Database - Architecture 3-Tiers

Application web de recherche et gestion de jeux Steam avec architecture 3-tiers complète (Présentation, Métier, Données) et base de données MongoDB.

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Technologies](#-technologies)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [API REST](#-api-rest)
- [Structure du projet](#-structure-du-projet)

## ✨ Fonctionnalités

### Recherche et Filtrage
- 🔍 **Recherche textuelle** par titre ou tags
- 🎯 **Filtrage par genre** (dropdown avec genres uniques)
- 🔢 **Tri multi-critères**:
  - Par titre (A-Z)
  - Par score (% positif)
  - Par prix
  - Par date de sortie
  - Par nombre d'avis
  - Par popularité
- ⬆️⬇️ **Ordre ascendant/descendant**
- 📄 **Pagination** (20 jeux par page)

### Gestion CRUD
- ➕ **Ajouter** un nouveau jeu
- 🗑️ **Supprimer** un jeu existant
- 💾 **Persistance** des données dans MongoDB
- 🔄 **Modifications en temps réel**

### Interface Utilisateur
- 🖼️ **Images agrandies** (240px × 135px)
- 📊 **Statistiques** en temps réel
- 🎨 **Design moderne** et responsive
- 🚫 **Filtrage automatique** du contenu adulte

## 🏗️ Architecture

### Architecture 3-Tiers

```
┌──────────────────────────────────────────────────┐
│         COUCHE 1: PRÉSENTATION (Frontend)        │
│  - HTML/CSS/JavaScript                           │
│  - Interface utilisateur                         │
│  - Communication via Fetch API                   │
│  Fichiers: public/index.html, public/app.js      │
└────────────────────┬─────────────────────────────┘
                     │ HTTP/REST
                     │ (Port 3000)
                     ▼
┌──────────────────────────────────────────────────┐
│         COUCHE 2: MÉTIER (Business Logic)        │
│  - GameService.js                                │
│  - Logique de filtrage, tri, validation          │
│  - Transformations de données                    │
│  Fichiers: src/business/GameService.js           │
└────────────────────┬─────────────────────────────┘
                     │ Async/Await
                     │ Appels de méthodes
                     ▼
┌──────────────────────────────────────────────────┐
│         COUCHE 3: DONNÉES (Data Layer)           │
│  - GameDatabase.js                               │
│  - Accès MongoDB                                 │
│  - Opérations CRUD                               │
│  Fichiers: src/database/GameDatabase.js          │
└────────────────────┬─────────────────────────────┘
                     │ MongoDB Driver
                     │ TCP/IP (Port 27017)
                     ▼
┌──────────────────────────────────────────────────┐
│              MongoDB Server                      │
│  - Base de données: steamGamesDB                 │
│  - Collection: games                             │
│  - ~110 000 documents                            │
└──────────────────────────────────────────────────┘
```

### Couches détaillées

#### 🎨 Couche 1: Présentation
- **Rôle**: Interface utilisateur et expérience utilisateur
- **Technologies**: HTML5, CSS3, JavaScript ES6+
- **Responsabilités**:
  - Affichage des jeux
  - Gestion des événements utilisateur
  - Communication avec l'API REST
  - Rendu dynamique des résultats

#### 💼 Couche 2: Métier
- **Rôle**: Logique métier et règles de gestion
- **Classe**: `GameService`
- **Responsabilités**:
  - Validation des données
  - Filtrage et tri des jeux
  - Calculs de statistiques
  - Transformation des données

#### 💾 Couche 3: Données
- **Rôle**: Persistance et accès aux données
- **Classe**: `GameDatabase`
- **Responsabilités**:
  - Connexion à MongoDB
  - Opérations CRUD
  - Gestion des index
  - Requêtes optimisées

## 🛠️ Technologies

### Backend
- **Node.js** (v20.12.2) - Runtime JavaScript
- **Express.js** - Framework web
- **MongoDB** (v7.0+) - Base de données NoSQL
- **MongoDB Native Driver** (v7.0.0) - Client MongoDB pour Node.js

### Frontend
- **HTML5** - Structure
- **CSS3** - Style
- **JavaScript ES6+** - Logique client
- **Fetch API** - Communication REST

### Outils
- **JSONStream** - Streaming de gros fichiers JSON
- **npm** - Gestionnaire de paquets

## 📦 Installation

### Prérequis

1. **Node.js** (v20 ou supérieur)
   - Télécharger: https://nodejs.org/

2. **MongoDB** (v7.0 ou supérieur)
   - Télécharger: https://www.mongodb.com/try/download/community
   - Voir le guide détaillé: [MONGODB_SETUP.md](MONGODB_SETUP.md)

### Installation pas à pas

#### 1. Cloner le projet

```powershell
git clone <url-du-repo>
cd LCAD_Projet_2025
```

#### 2. Installer les dépendances

```powershell
npm install
```

Packages installés:
- `express` - Framework web
- `mongodb` - Driver MongoDB
- `JSONStream` - Parsing de JSON

#### 3. Installer et démarrer MongoDB

Voir le guide complet: **[MONGODB_SETUP.md](MONGODB_SETUP.md)**

Résumé rapide:

```powershell
# Vérifier si MongoDB est installé
mongod --version

# Démarrer le service MongoDB
Start-Service MongoDB

# Vérifier le statut
Get-Service MongoDB
```

#### 4. Importer les données dans MongoDB

```powershell
node scripts/migrate_to_mongodb.js
```

Ce script va:
- Se connecter à MongoDB
- Créer la base `steamGamesDB`
- Importer ~110 000 jeux depuis `games_meta.json`
- Créer les index pour optimiser les requêtes

⏱️ **Temps d'import**: 5-10 minutes

#### 5. Démarrer le serveur

```powershell
node server.js
```

Vous devriez voir:

```
============================================================
🚀 Serveur démarré sur http://localhost:3000
📊 Base de données MongoDB: 109632 jeux

🏗️  Architecture 3-tiers:
   └─ Couche 1 (Données): GameDatabase (MongoDB)
   └─ Couche 2 (Métier): GameService
   └─ Couche 3 (API): GameController
============================================================
```

#### 6. Ouvrir l'application

Navigateur: **http://localhost:3000**

## 🚀 Utilisation

### Interface de recherche

1. **Recherche textuelle**: Tapez un titre ou un tag dans la barre de recherche
2. **Filtrage par genre**: Sélectionnez un genre dans le dropdown
3. **Tri**: Choisissez un critère de tri (titre, score, prix, date, avis, popularité)
4. **Ordre**: Basculez entre ordre croissant/décroissant
5. **Navigation**: Utilisez les boutons de pagination

### Interface d'administration

1. Cliquez sur **"Mode Admin"**
2. **Ajouter un jeu**:
   - Remplissez le formulaire
   - Cliquez sur "Ajouter le jeu"
3. **Supprimer un jeu**:
   - Cliquez sur le bouton "Supprimer" sous un jeu

### Statistiques

Affichage en temps réel:
- Nombre total de jeux
- Nombre total d'avis
- Jeu le plus populaire
- Prix moyen

## 🔌 API REST

### Endpoints disponibles

#### `GET /api/games`
Rechercher et filtrer les jeux

**Query Parameters**:
- `search` (string): Recherche textuelle
- `genre` (string): Filtrer par genre
- `sort` (string): Critère de tri (`title`, `score`, `price`, `date`, `reviews`, `popularity`)
- `order` (string): Ordre (`asc`, `desc`)
- `page` (number): Numéro de page
- `limit` (number): Jeux par page

**Exemple**:
```http
GET /api/games?search=doom&genre=Action&sort=score&order=desc&page=1&limit=20
```

**Réponse**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalGames": 100,
    "limit": 20
  }
}
```

#### `GET /api/games/:id`
Obtenir les détails d'un jeu

**Exemple**:
```http
GET /api/games/1234567
```

#### `POST /api/games`
Ajouter un nouveau jeu

**Body**:
```json
{
  "title": "Nouveau Jeu",
  "positive": 1000,
  "negative": 100,
  "price": 19.99,
  "genres": ["Action", "Adventure"],
  "description": "Description du jeu"
}
```

#### `DELETE /api/games/:id`
Supprimer un jeu

**Exemple**:
```http
DELETE /api/games/1234567
```

#### `GET /api/stats`
Obtenir les statistiques globales

#### `GET /api/genres`
Obtenir la liste de tous les genres

## 📁 Structure du projet

```
LCAD_Projet_2025/
│
├── 📂 src/                          # Code source (3 couches)
│   ├── 📂 api/                      # Couche API (REST)
│   │   └── GameController.js        # Contrôleurs REST
│   ├── 📂 business/                 # Couche Métier
│   │   └── GameService.js           # Logique métier
│   └── 📂 database/                 # Couche Données
│       ├── GameDatabase.js          # Accès MongoDB
│       └── config.js                # Configuration MongoDB
│
├── 📂 public/                       # Frontend (Présentation)
│   ├── index.html                   # Interface utilisateur
│   ├── style.css                    # Styles
│   └── app.js                       # Logique client
│
├── 📂 scripts/                      # Scripts utilitaires
│   ├── migrate_to_mongodb.js        # Import des données
│   └── build_metadata.js            # (ancien script)
│
├── 📄 server.js                     # Point d'entrée (orchestrateur)
├── 📄 package.json                  # Dépendances npm
├── 📄 games_meta.json              # Données source (~92 MB)
├── 📄 README.md                    # Ce fichier
├── 📄 MONGODB_SETUP.md             # Guide d'installation MongoDB
└── 📄 index.js                     # (ancien code monolithique)
```

## 🎯 Évolutions futures

### Fonctionnalités
- [ ] Authentification utilisateurs
- [ ] Système de favoris
- [ ] Recommandations personnalisées
- [ ] Export de données (CSV, JSON)
- [ ] Filtres avancés (multi-genres, fourchette de prix)
- [ ] Graphiques et statistiques avancées

### Technique
- [ ] Cache Redis pour les requêtes fréquentes
- [ ] Tests unitaires et d'intégration
- [ ] Documentation API (Swagger/OpenAPI)
- [ ] Docker et docker-compose
- [ ] CI/CD (GitHub Actions)
- [ ] Monitoring et logs (Winston, Morgan)

## 📚 Documentation complémentaire

- **[MONGODB_SETUP.md](MONGODB_SETUP.md)** - Guide complet d'installation MongoDB
- **[Express.js Documentation](https://expressjs.com/)**
- **[MongoDB Node.js Driver](https://mongodb.github.io/node-mongodb-native/)**

## 🐛 Dépannage

### MongoDB ne démarre pas

```powershell
# Vérifier le service
Get-Service MongoDB

# Démarrer le service
Start-Service MongoDB
```

### Erreur "ECONNREFUSED"

MongoDB n'est pas en cours d'exécution. Voir [MONGODB_SETUP.md](MONGODB_SETUP.md).

### Base de données vide

Exécutez le script de migration:

```powershell
node scripts/migrate_to_mongodb.js
```

## 👨‍💻 Auteur

**Celia** - M2 LCAD 2025

## 📄 Licence

Ce projet est à usage éducatif dans le cadre du cours LCAD.

---

**Architecture**: 3-Tiers (Présentation, Métier, Données)  
**Base de données**: MongoDB  
**Backend**: Node.js + Express  
**Frontend**: HTML/CSS/JavaScript  
**Données**: ~110 000 jeux Steam
