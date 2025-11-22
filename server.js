// Serveur principal - Architecture 3-tiers
const express = require('express');
const path = require('path');
const GameDatabase = require('./src/database/GameDatabase');
const GameService = require('./src/business/GameService');
const GameController = require('./src/api/GameController');

// Initialisation d'Express
const app = express();

// Middlewares
app.use(express.json());
app.use(express.static('public'));

// CORS pour permettre les requêtes depuis le frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Initialisation des couches
const database = new GameDatabase();
const gameService = new GameService(database);
const gameController = new GameController(gameService);

// Routes API
app.use('/api', gameController.createRoutes());

// Route principale - servir le frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrage du serveur
async function startServer() {
  try {
    console.log('🚀 Démarrage du serveur...');
    
    // Connexion à MongoDB
    await database.connect();
    
    // Vérifier si la base contient des données
    const count = await database.getTotalGames();
    
    if (count === 0) {
      console.log('⚠️  La base de données est vide.');
      console.log('💡 Exécutez le script de migration pour importer les données:');
      console.log('   node scripts/migrate_to_mongodb.js');
    }
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`📊 Base de données MongoDB: ${count} jeux`);
      console.log(`\n🏗️  Architecture 3-tiers:`);
      console.log(`   └─ Couche 1 (Données): GameDatabase (MongoDB)`);
      console.log(`   └─ Couche 2 (Métier): GameService`);
      console.log(`   └─ Couche 3 (API): GameController`);
      console.log(`\n🔗 API disponible:`);
      console.log(`   GET    /api/games       - Liste des jeux`);
      console.log(`   GET    /api/games/:id   - Détails d'un jeu`);
      console.log(`   POST   /api/games       - Ajouter un jeu`);
      console.log(`   PUT    /api/games/:id   - Mettre à jour un jeu`);
      console.log(`   DELETE /api/games/:id   - Supprimer un jeu`);
      console.log(`   GET    /api/stats       - Statistiques`);
      console.log(`   GET    /api/genres      - Liste des genres`);
      console.log(`${'='.repeat(60)}\n`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    console.error('\n💡 Assurez-vous que MongoDB est installé et en cours d\'exécution:');
    console.error('   1. Téléchargez MongoDB: https://www.mongodb.com/try/download/community');
    console.error('   2. Installez MongoDB');
    console.error('   3. Démarrez le service MongoDB');
    console.error('   4. Relancez ce serveur\n');
    process.exit(1);
  }
}

// Gérer l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await database.disconnect();
  process.exit(0);
});

startServer();
