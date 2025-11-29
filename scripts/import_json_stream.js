// Script pour importer games.json vers MongoDB Atlas en streaming
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const { Transform } = require('stream');

// URL de connexion MongoDB Atlas
const MONGO_URL = 'mongodb+srv://celiamakhlou_db_user:091203Celia@cluster0.tn44ynk.mongodb.net/?appName=Cluster0';
const DB_NAME = 'steam_games_db';
const COLLECTION_NAME = 'games';

async function importData() {
  let client;
  
  try {
    console.log('Connexion à MongoDB Atlas...');
    client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log('✓ Connecté à MongoDB Atlas');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    
    // Vérifier si la collection existe déjà et contient des données
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`\n⚠️  La collection contient déjà ${existingCount} documents.`);
      console.log('Suppression des données existantes dans 2 secondes... (Ctrl+C pour annuler)');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Suppression des données existantes...');
      await collection.deleteMany({});
      console.log('✓ Données existantes supprimées');
    }
    
    // Lire games.json
    console.log('\nChargement des données depuis games.json...');
    const jsonPath = path.join(__dirname, '..', 'games.json');
    const fileContent = fs.readFileSync(jsonPath, 'utf8');
    
    console.log('Parsing du JSON (cela peut prendre quelques secondes)...');
    const gamesObject = JSON.parse(fileContent);
    const appIds = Object.keys(gamesObject);
    
    console.log(`✓ ${appIds.length} jeux trouvés`);
    
    // Importer par lots
    console.log('\nImportation des données...');
    const batchSize = 500;
    let imported = 0;
    let games = [];
    
    for (const appId of appIds) {
      const game = gamesObject[appId];
      
      // Transformer en format MongoDB
      const transformedGame = {
        appId: parseInt(appId),
        title: game.name,
        date_release: game.release_date,
        win: game.platforms?.windows === true,
        mac: game.platforms?.mac === true,
        linux: game.platforms?.linux === true,
        rating: game.required_age || 0,
        positive_ratio: game.positive_ratio || 0,
        user_reviews: game.user_reviews || 0,
        price_final: parseFloat(game.price) || 0,
        price_original: parseFloat(game.price) || 0,
        discount: 0,
        steam_deck: false,
        genres: Array.isArray(game.genres) ? game.genres : [],
        tags: Array.isArray(game.tags) ? game.tags : [],
        reviewsPositive: game.positive || 0,
        reviewsNegative: game.negative || 0,
        reviewsTotal: (game.positive || 0) + (game.negative || 0)
      };
      
      games.push(transformedGame);
      
      // Importer par lots
      if (games.length >= batchSize) {
        try {
          await collection.insertMany(games, { ordered: false });
          imported += games.length;
          const progress = Math.round((imported / appIds.length) * 100);
          process.stdout.write(`\r✓ Importé: ${imported}/${appIds.length} jeux (${progress}%)`);
          games = [];
        } catch (error) {
          if (!error.message.includes('duplicate key')) {
            console.error('\n❌ Erreur:', error.message);
          }
          imported += games.length;
          games = [];
        }
      }
    }
    
    // Insérer le dernier lot
    if (games.length > 0) {
      try {
        await collection.insertMany(games, { ordered: false });
        imported += games.length;
      } catch (error) {
        if (!error.message.includes('duplicate key')) {
          console.error('\n❌ Erreur:', error.message);
        }
      }
    }
    
    console.log('\n\n✓ Importation terminée !');
    
    // Créer les index
    console.log('\nCréation des index...');
    await collection.createIndex({ appId: 1 }, { unique: true });
    await collection.createIndex({ title: 'text', tags: 'text' });
    await collection.createIndex({ genres: 1 });
    await collection.createIndex({ reviewsTotal: -1 });
    console.log('✓ Index créés');
    
    // Statistiques finales
    const finalCount = await collection.countDocuments();
    console.log(`\n${'='.repeat(60)}`);
    console.log('IMPORTATION RÉUSSIE');
    console.log(`Total: ${finalCount} jeux importés dans MongoDB Atlas`);
    console.log(`Base: ${DB_NAME}`);
    console.log(`Collection: ${COLLECTION_NAME}`);
    console.log(`${'='.repeat(60)}\n`);
    
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'importation:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('Connexion fermée.');
    }
  }
}

// Exécuter l'importation
importData();
