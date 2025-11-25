# 🚀 Déploiement Rapide sur Render.com

## Étape 1: MongoDB Atlas (5 minutes)

1. Allez sur https://www.mongodb.com/cloud/atlas/register
2. Créez un compte gratuit
3. **Create a Cluster** → Choisissez "M0 Free"
4. **Database Access** → Add New Database User:
   - Username: `steamgames`
   - Password: (générez un mot de passe fort, notez-le)
   - Database User Privileges: "Read and write to any database"
5. **Network Access** → Add IP Address:
   - Cliquez "Allow Access from Anywhere" → Confirm
6. **Connect** → Connect your application:
   - Copiez l'URL de connexion, ressemble à:
   ```
   mongodb+srv://steamgames:VOTRE_MOT_DE_PASSE@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Étape 2: Migrer les données (10 minutes)

1. Ouvrez `src/database/config.js`
2. Modifiez temporairement:
   ```javascript
   mongoUrl: 'mongodb+srv://steamgames:VOTRE_MOT_DE_PASSE@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority',
   dbName: 'steamGamesDB',
   ```
3. Exécutez la migration:
   ```powershell
   node scripts/migrate_to_mongodb.js
   ```
4. Attendez (~5-10 min pour 109k jeux)
5. Remettez `config.js` comme avant (avec `process.env.MONGO_URL`)

## Étape 3: Pousser sur GitHub

```powershell
git add .
git commit -m "Prêt pour déploiement"
git push origin main
```

## Étape 4: Déployer sur Render (5 minutes)

1. Allez sur https://render.com
2. Créez un compte (utilisez GitHub)
3. **Dashboard** → **New** → **Web Service**
4. Connectez votre repo `LCAD_Projet_2025`
5. Configuration:
   - **Name**: `steam-games-db`
   - **Region**: Frankfurt (plus proche de vous)
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

6. **Advanced** → Environment Variables:
   - `MONGO_URL`: (collez l'URL MongoDB Atlas)
   - `DB_NAME`: `steamGamesDB`
   - `NODE_ENV`: `production`

7. **Create Web Service**

## Étape 5: Attendez le déploiement

- Render va installer les dépendances (~2 min)
- Démarrer le serveur (~30 sec)
- Votre site sera accessible à: `https://steam-games-db.onrender.com`

## ✅ C'est fait !

Testez votre site sur l'URL fournie par Render.

## ⚠️ Note importante

Le tier gratuit de Render met votre application en veille après 15 minutes d'inactivité.
Au premier accès après la veille, il faudra ~30 secondes pour redémarrer.

## 🔧 Dépannage

**Erreur "Cannot connect to MongoDB":**
- Vérifiez que l'URL MongoDB est correcte
- Vérifiez que 0.0.0.0/0 est autorisé dans Network Access

**Logs:**
Render Dashboard → Votre service → Logs (en bas)
