// Script pour importer les données vers MongoDB Atlas depuis CSV
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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
      
      // Attendre 2 secondes avant de continuer
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Suppression des données existantes...');
      await collection.deleteMany({});
      console.log('✓ Données existantes supprimées');
    }
    
    // Lire le fichier CSV ligne par ligne
    console.log('\nChargement des données depuis games.csv...');
    const csvPath = path.join(__dirname, '..', 'archive', 'games.csv');
    const fileStream = fs.createReadStream(csvPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });
    
    let headers = [];
    let games = [];
    let lineCount = 0;
    
    // Parser le CSV ligne par ligne
    for await (const line of rl) {
      lineCount++;
      
      if (lineCount === 1) {
        // Première ligne = headers
        headers = line.split(',');
        continue;
      }
      
      // Parser la ligne CSV (gestion des guillemets et virgules)
      const values = parseCSVLine(line);
      
      if (values.length === headers.length) {
        const game = {};
        headers.forEach((header, index) => {
          game[header.trim()] = values[index];
        });
        
        // Transformer en format MongoDB
        const transformedGame = {
          appId: parseInt(game.AppID) || parseInt(game.app_id),
          title: game.Name || game.title,
          date_release: game.Release_date || game.date_release,
          win: game.Windows === 'True' || game.win === 'True',
          mac: game.Mac === 'True' || game.mac === 'True',
          linux: game.Linux === 'True' || game.linux === 'True',
          rating: game.Required_age || game.rating,
          positive_ratio: parseFloat(game.Positive || game.positive_ratio) || 0,
          user_reviews: parseInt(game.User_reviews || game.user_reviews) || 0,
          price_final: parseFloat(game.Price || game.price_final) || 0,
          price_original: parseFloat(game.Price || game.price_original) || 0,
          discount: parseFloat(game.Discount || game.discount) || 0,
          steam_deck: game.Steam_deck === 'True' || game.steam_deck === 'True',
          genres: game.Genres ? game.Genres.split(',').map(g => g.trim()) : [],
          tags: game.Tags ? game.Tags.split(',').map(t => t.trim()) : [],
          reviewsPositive: parseInt(game.reviewsPositive) || 0,
          reviewsNegative: parseInt(game.reviewsNegative) || 0,
          reviewsTotal: parseInt(game.reviewsTotal) || 0
        };
        
        games.push(transformedGame);
        
        // Importer par lots de 500
        if (games.length >= 500) {
          try {
            await collection.insertMany(games, { ordered: false });
            process.stdout.write(`\r✓ Importé: ${lineCount - 1} lignes traitées`);
            games = [];
          } catch (error) {
            // Ignorer les erreurs de doublons
            if (!error.message.includes('duplicate key')) {
              console.error('\n❌ Erreur lors de l\'insertion:', error.message);
            }
            games = [];
          }
        }
      }
    }
    
    // Insérer le dernier lot
    if (games.length > 0) {
      try {
        await collection.insertMany(games, { ordered: false });
      } catch (error) {
        if (!error.message.includes('duplicate key')) {
          console.error('\n❌ Erreur lors de l\'insertion:', error.message);
        }
      }
    }
    
    console.log('\n\n✓ Importation terminée !');
    
    // Fonction pour parser une ligne CSV avec gestion des guillemets
    function parseCSVLine(line) {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    }
    
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
    console.error('\n❌ Erreur lors de l\'importation:', error);
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
