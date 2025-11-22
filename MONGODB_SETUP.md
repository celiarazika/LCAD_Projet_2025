# Installation et Configuration de MongoDB sur Windows

## 📥 Installation de MongoDB

### Étape 1: Télécharger MongoDB Community Server

1. Visitez: https://www.mongodb.com/try/download/community
2. Sélectionnez:
   - **Version**: 7.0 ou plus récente
   - **Platform**: Windows
   - **Package**: MSI
3. Cliquez sur **Download**

### Étape 2: Installer MongoDB

1. Exécutez le fichier `.msi` téléchargé
2. Choisissez **"Complete"** installation
3. Configurez MongoDB comme **Service Windows**:
   - ✅ Cochez "Install MongoDB as a Service"
   - ✅ Service Name: MongoDB
   - ✅ Run service as Network Service user
4. ❌ **Décochez** "Install MongoDB Compass" (optionnel, interface graphique)
5. Cliquez sur **Install**

### Étape 3: Vérifier l'installation

Ouvrez PowerShell et exécutez:

```powershell
# Vérifier si MongoDB est installé
mongod --version

# Vérifier si le service MongoDB est en cours d'exécution
Get-Service MongoDB
```

Si le service n'est pas démarré:

```powershell
# Démarrer le service MongoDB
Start-Service MongoDB

# Configurer le démarrage automatique
Set-Service MongoDB -StartupType Automatic
```

## 🚀 Utilisation avec le projet

### 1. S'assurer que MongoDB est en cours d'exécution

```powershell
# Vérifier le statut
Get-Service MongoDB

# Si arrêté, démarrer:
Start-Service MongoDB
```

### 2. Importer les données dans MongoDB

Une fois MongoDB en cours d'exécution, importez les données du fichier JSON:

```powershell
node scripts/migrate_to_mongodb.js
```

Ce script va:
- Se connecter à MongoDB (localhost:27017)
- Créer la base de données `steamGamesDB`
- Créer la collection `games`
- Importer tous les jeux depuis `games_meta.json`
- Créer les index nécessaires

⏱️ **Temps estimé**: 5-10 minutes pour ~110 000 jeux

### 3. Démarrer le serveur

```powershell
node server.js
```

Le serveur se connectera automatiquement à MongoDB et affichera:
- ✅ Connecté à MongoDB
- 📊 Nombre de jeux dans la base de données

## 🛠️ Commandes utiles

### Gestion du service MongoDB

```powershell
# Démarrer MongoDB
Start-Service MongoDB

# Arrêter MongoDB
Stop-Service MongoDB

# Redémarrer MongoDB
Restart-Service MongoDB

# Voir le statut
Get-Service MongoDB
```

### Se connecter au shell MongoDB

```powershell
# Ouvrir le shell MongoDB
mongosh

# Commandes dans le shell:
use steamGamesDB                    # Sélectionner la base de données
db.games.countDocuments()          # Compter les jeux
db.games.findOne()                 # Voir un jeu exemple
db.games.find({title: "Doom"})     # Chercher un jeu
show collections                   # Lister les collections
exit                               # Quitter le shell
```

### Supprimer toutes les données (réinitialiser)

```powershell
# Se connecter au shell MongoDB
mongosh

# Dans le shell:
use steamGamesDB
db.games.drop()
exit
```

Puis réimporter:
```powershell
node scripts/migrate_to_mongodb.js
```

## 📍 Configuration

La configuration MongoDB se trouve dans `src/database/config.js`:

```javascript
module.exports = {
  mongoUrl: 'mongodb://localhost:27017',  // URL de connexion
  dbName: 'steamGamesDB',                 // Nom de la base
  collectionName: 'games',                // Nom de la collection
  options: {
    // Options de connexion
  }
};
```

## 🔧 Dépannage

### MongoDB ne démarre pas

**Solution 1**: Vérifier si le port 27017 est utilisé
```powershell
netstat -ano | findstr :27017
```

**Solution 2**: Vérifier les logs MongoDB
```powershell
Get-EventLog -LogName Application -Source MongoDB -Newest 10
```

**Solution 3**: Réinstaller MongoDB en tant qu'administrateur

### Erreur "MongoServerError: connect ECONNREFUSED"

MongoDB n'est pas en cours d'exécution. Démarrez le service:
```powershell
Start-Service MongoDB
```

### Erreur lors de l'import des données

Assurez-vous que:
1. MongoDB est en cours d'exécution
2. Le fichier `games_meta.json` existe
3. Vous avez suffisamment d'espace disque (~2 GB recommandé)

## 📊 Avantages de MongoDB pour ce projet

### Avant (In-Memory)
- ❌ Données perdues à chaque redémarrage
- ❌ Chargement lent au démarrage (~10 secondes)
- ❌ Consommation RAM élevée (~500 MB)
- ❌ Pas de persistance des ajouts/suppressions

### Après (MongoDB)
- ✅ Données persistantes
- ✅ Démarrage instantané
- ✅ Faible consommation RAM
- ✅ CRUD réellement fonctionnel
- ✅ Requêtes optimisées avec index
- ✅ Scalabilité (peut gérer millions de documents)

## 🔗 Ressources

- [Documentation MongoDB](https://docs.mongodb.com/)
- [MongoDB University (cours gratuits)](https://university.mongodb.com/)
- [MongoDB Compass (GUI)](https://www.mongodb.com/products/compass)
- [Node.js MongoDB Driver](https://mongodb.github.io/node-mongodb-native/)

## 📝 Architecture 3-Tiers avec MongoDB

```
┌─────────────────────────────────────┐
│   Couche Présentation (Frontend)    │
│   - HTML/CSS/JavaScript              │
│   - Interface utilisateur            │
└─────────────┬───────────────────────┘
              │ HTTP/REST API
              ▼
┌─────────────────────────────────────┐
│   Couche Métier (Business Logic)    │
│   - GameService.js                   │
│   - Validation, filtrage, tri        │
└─────────────┬───────────────────────┘
              │ Async/Await
              ▼
┌─────────────────────────────────────┐
│   Couche Données (Data Layer)       │
│   - GameDatabase.js                  │
│   - MongoDB Client                   │
└─────────────┬───────────────────────┘
              │ TCP/IP
              ▼
┌─────────────────────────────────────┐
│        MongoDB Server                │
│   - Base: steamGamesDB               │
│   - Collection: games                │
│   - Port: 27017                      │
└─────────────────────────────────────┘
```
