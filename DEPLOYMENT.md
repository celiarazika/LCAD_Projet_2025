# 🚀 Guide de Déploiement

## ⚠️ GitHub Pages ne fonctionne PAS pour ce projet

GitHub Pages héberge uniquement des sites **statiques** (HTML/CSS/JS).
Votre projet nécessite:
- ✅ Backend Node.js + Express
- ✅ Base de données MongoDB
- ✅ API REST dynamique

## 🎯 Solutions d'hébergement recommandées

---

## Option 1: Render.com (Recommandé - GRATUIT)

### ✅ Avantages
- Gratuit pour toujours (tier gratuit généreux)
- Supporte Node.js
- Déploiement automatique depuis GitHub
- SSL gratuit
- Simple à configurer

### 📋 Étapes de déploiement

#### 1. Préparer MongoDB Atlas (Base de données cloud gratuite)

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Créez un **cluster gratuit** (M0)
3. Dans **Database Access**: Créez un utilisateur avec mot de passe
4. Dans **Network Access**: Ajoutez `0.0.0.0/0` (autoriser toutes les IPs)
5. Cliquez sur **Connect** → **Connect your application**
6. Copiez l'URL de connexion:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/steamGamesDB?retryWrites=true&w=majority
   ```

#### 2. Migrer les données vers MongoDB Atlas

```powershell
# Modifier temporairement src/database/config.js avec l'URL MongoDB Atlas
# Puis exécuter:
node scripts/migrate_to_mongodb.js
```

#### 3. Déployer sur Render

1. Créez un compte sur [render.com](https://render.com)
2. Cliquez sur **New +** → **Web Service**
3. Connectez votre dépôt GitHub `LCAD_Projet_2025`
4. Configuration:
   - **Name**: `steam-games-database`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Variables d'environnement:
   - `MONGODB_URI`: (coller l'URL MongoDB Atlas)
   - `DB_NAME`: `steamGamesDB`
   - `NODE_ENV`: `production`
6. Cliquez sur **Create Web Service**

#### 4. Accéder à votre site

Render vous donnera une URL comme:
```
https://steam-games-database.onrender.com
```

---

## Option 2: Railway.app (GRATUIT avec crédits)

### ✅ Avantages
- $5 de crédits gratuits par mois
- Très simple
- Supporte Node.js et MongoDB

### 📋 Étapes

1. Allez sur [railway.app](https://railway.app)
2. Connectez GitHub
3. **New Project** → Deploy from GitHub
4. Sélectionnez `LCAD_Projet_2025`
5. Ajoutez un service **MongoDB** (inclus gratuitement)
6. Ajoutez les variables d'environnement automatiquement

---

## Option 3: Vercel + MongoDB Atlas

### ✅ Avantages
- Très rapide
- Gratuit
- Excellent pour Node.js

### 📋 Étapes

1. Installez Vercel CLI:
   ```powershell
   npm install -g vercel
   ```

2. Créez un fichier `vercel.json`:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

3. Déployez:
   ```powershell
   vercel
   ```

---

## Option 4: Heroku (Payant depuis 2022)

Heroku a supprimé son offre gratuite. Coût: ~$7/mois minimum.

---

## Option 5: VPS (Avancé)

### Providers:
- **DigitalOcean**: $5/mois
- **Linode**: $5/mois
- **OVH**: €3.50/mois

### Prérequis:
- Connaissances Linux
- Configuration manuelle
- Gestion des mises à jour

---

## 📊 Comparatif des solutions

| Solution | Prix | Difficulté | Performance | MongoDB inclus |
|----------|------|------------|-------------|----------------|
| **Render** | Gratuit | ⭐ Facile | Bonne | Non (Atlas) |
| **Railway** | $5 crédits/mois | ⭐ Facile | Très bonne | ✅ Oui |
| **Vercel** | Gratuit | ⭐⭐ Moyen | Excellente | Non (Atlas) |
| **Heroku** | $7/mois | ⭐ Facile | Bonne | Non (Atlas) |
| **VPS** | $5/mois | ⭐⭐⭐ Difficile | Excellente | À installer |

---

## 🎯 Recommandation personnelle

### Pour ce projet universitaire: **Render.com**

**Pourquoi ?**
1. ✅ **Gratuit** à 100%
2. ✅ **Simple** - Déploiement en 5 minutes
3. ✅ **Automatique** - Se met à jour avec chaque commit GitHub
4. ✅ **Fiable** - Bonne disponibilité
5. ✅ **SSL** - HTTPS gratuit

**Inconvénient:**
- ⏱️ Le serveur s'endort après 15 min d'inactivité (redémarre en ~30 sec au premier accès)

---

## 📝 Checklist avant déploiement

- [ ] Code pushé sur GitHub
- [ ] MongoDB Atlas configuré
- [ ] Données migrées vers MongoDB Atlas
- [ ] Variables d'environnement configurées
- [ ] `render.yaml` créé
- [ ] `package.json` contient `"start": "node server.js"`
- [ ] Test en local fonctionne

---

## 🔧 Modifications nécessaires pour le déploiement

Les modifications suivantes ont déjà été appliquées:

### 1. `src/database/config.js`
```javascript
mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017'
```

### 2. `server.js`
```javascript
app.listen(PORT, '0.0.0.0', () => {
```

### 3. `render.yaml` créé
Configuration automatique pour Render

---

## 🆘 Support et dépannage

### Problème: "Cannot connect to MongoDB"
**Solution**: Vérifiez que:
1. L'URL MongoDB Atlas est correcte
2. Le mot de passe ne contient pas de caractères spéciaux
3. L'IP `0.0.0.0/0` est autorisée dans Network Access

### Problème: "Application Error"
**Solution**: Consultez les logs sur Render:
- Dashboard → Votre service → Logs

### Problème: "Site très lent au premier chargement"
**Normal**: Le tier gratuit de Render met le serveur en veille après 15 min.
**Solution**: Utiliser Railway (toujours actif) ou passer au plan payant ($7/mois)

---

## 📚 Ressources utiles

- [Documentation Render](https://render.com/docs)
- [MongoDB Atlas Guide](https://docs.atlas.mongodb.com/getting-started/)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)

---

## 💡 Alternative: Démonstration locale

Si vous voulez juste **présenter** votre projet sans l'héberger:

1. Installez **ngrok** pour exposer localhost:
   ```powershell
   choco install ngrok
   ngrok http 3000
   ```

2. Ngrok vous donnera une URL temporaire accessible sur Internet
3. Parfait pour une démonstration de quelques heures

---

## 🎓 Pour le rendu universitaire

Si vous devez fournir une URL accessible:

**Option 1 (Recommandée)**: Déployez sur Render et fournissez l'URL

**Option 2**: Utilisez ngrok pendant la présentation

**Option 3**: Fournissez:
- Le code source (GitHub)
- Un README détaillé
- Des captures d'écran
- Une vidéo de démonstration

---

## ✅ Votre projet est maintenant prêt pour le déploiement !

Choisissez une des options ci-dessus et suivez le guide étape par étape.
