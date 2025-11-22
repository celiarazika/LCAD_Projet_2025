# Architecture 3-Tiers - Steam Games Database

## 🏗️ Structure du Projet

```
LCAD_Projet_2025/
├── src/                          # Code source backend
│   ├── database/                 # 🗄️ COUCHE 1: Données
│   │   └── GameDatabase.js       # Gestion de la base de données
│   ├── business/                 # 💼 COUCHE 2: Logique Métier
│   │   └── GameService.js        # Services et règles métier
│   └── api/                      # 🌐 COUCHE 3: API REST
│       └── GameController.js     # Contrôleurs HTTP
├── public/                       # 🎨 Frontend (Présentation)
│   ├── index.html                # Interface utilisateur
│   ├── style.css                 # Styles
│   └── app.js                    # Logique frontend (appels API)
├── server.js                     # Point d'entrée du serveur
├── index.js                      # Ancien serveur (archive)
├── games_meta.json               # Base de données JSON
└── package.json                  # Dépendances npm
```

## 📋 Architecture 3-Tiers

### Couche 1: Données (Data Layer)
**Fichier**: `src/database/GameDatabase.js`

**Responsabilité**: Gestion directe des données
- Chargement des données depuis JSON
- CRUD sur les jeux (Create, Read, Update, Delete)
- Accès direct à la collection de jeux
- Extraction des genres uniques

**Méthodes principales**:
- `loadData()` - Charger les données
- `getAllGames()` - Récupérer tous les jeux
- `getGameById(id)` - Récupérer un jeu par ID
- `addGame(data)` - Ajouter un jeu
- `deleteGame(id)` - Supprimer un jeu
- `getAllGenres()` - Récupérer les genres

### Couche 2: Logique Métier (Business Logic Layer)
**Fichier**: `src/business/GameService.js`

**Responsabilité**: Logique métier et règles de gestion
- Recherche et filtrage des jeux
- Tri des résultats (par titre, score, prix, date, popularité)
- Pagination des résultats
- Validation des données
- Calcul des statistiques
- Transformation des données

**Méthodes principales**:
- `searchGames(filters)` - Recherche avec filtres et pagination
- `sortGames(games, sort, order)` - Tri des jeux
- `getGameById(id)` - Récupération avec logique métier
- `addGame(data)` - Ajout avec validation
- `deleteGame(id)` - Suppression avec vérifications
- `getStatistics()` - Calcul des statistiques
- `getAllGenres()` - Récupération des genres filtrés

### Couche 3: API REST (Presentation Layer - Backend)
**Fichier**: `src/api/GameController.js`

**Responsabilité**: Exposition des services via HTTP
- Gestion des routes HTTP
- Validation des requêtes
- Formatage des réponses JSON
- Gestion des erreurs HTTP
- Logging des requêtes

**Endpoints**:
- `GET /api/games` - Liste des jeux (avec filtres)
- `GET /api/games/:id` - Détails d'un jeu
- `POST /api/games` - Ajouter un jeu
- `DELETE /api/games/:id` - Supprimer un jeu
- `GET /api/stats` - Statistiques
- `GET /api/genres` - Liste des genres

### Frontend (Présentation Layer - Client)
**Fichiers**: `public/index.html`, `public/app.js`, `public/style.css`

**Responsabilité**: Interface utilisateur
- Affichage des données
- Interaction utilisateur
- Appels à l'API REST
- Gestion de l'état côté client

## 🚀 Démarrage

### 1. Installer les dépendances
```bash
npm install
```

### 2. Démarrer le serveur
```bash
node server.js
```

### 3. Accéder à l'application
Ouvrez votre navigateur: `http://localhost:3000`

## 🔧 API REST

### Rechercher des jeux
```http
GET /api/games?search=action&genre=Action&sort=score&order=desc&page=1&limit=20
```

### Obtenir un jeu
```http
GET /api/games/730
```

### Ajouter un jeu
```http
POST /api/games
Content-Type: application/json

{
  "title": "Mon Jeu",
  "positive": 100,
  "negative": 10,
  "price": 19.99,
  "genres": "Action,Adventure",
  "tags": "Multiplayer,FPS"
}
```

### Supprimer un jeu
```http
DELETE /api/games/730
```

### Statistiques
```http
GET /api/stats
```

### Liste des genres
```http
GET /api/genres
```

## 📊 Avantages de l'Architecture 3-Tiers

✅ **Séparation des responsabilités** - Chaque couche a un rôle bien défini

✅ **Maintenabilité** - Modifications isolées par couche

✅ **Réutilisabilité** - Les services peuvent être utilisés par différentes interfaces

✅ **Testabilité** - Chaque couche peut être testée indépendamment

✅ **Scalabilité** - Possibilité de déployer chaque couche séparément

✅ **Flexibilité** - Changement de technologie par couche sans affecter les autres

## 🔄 Flux de Données

```
┌─────────────┐
│  Navigateur │  ← Couche Présentation (Frontend)
│ HTML/CSS/JS │
└──────┬──────┘
       │ HTTP/JSON
       ↓
┌─────────────────────┐
│  GameController     │  ← Couche API (REST)
│  (Routes Express)   │
└──────┬──────────────┘
       │ Appels de méthodes
       ↓
┌─────────────────────┐
│  GameService        │  ← Couche Métier
│  (Logique métier)   │
└──────┬──────────────┘
       │ Appels de méthodes
       ↓
┌─────────────────────┐
│  GameDatabase       │  ← Couche Données
│  (Accès données)    │
└──────┬──────────────┘
       │
       ↓
   [games_meta.json]
```

## 📝 Notes

- Les données sont chargées en mémoire au démarrage
- Les modifications (ajout/suppression) sont temporaires et perdues au redémarrage
- Pour une persistance réelle, il faudrait utiliser une vraie base de données (MongoDB, PostgreSQL, etc.)
- Le frontend utilise Vanilla JavaScript (sans framework) pour la simplicité

## 🔐 Sécurité

- Échappement HTML côté client et serveur
- Validation des entrées dans la couche métier
- CORS activé pour permettre les requêtes cross-origin
- Pas d'injection SQL possible (pas de SQL utilisé)
