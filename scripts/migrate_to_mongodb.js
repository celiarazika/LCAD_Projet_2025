// Script de migration des données JSON vers MongoDB
const fs = require('fs');
const path = require('path');
const JSONStream = require('JSONStream');
const { MongoClient } = require('mongodb');
const config = require('../src/database/config');

async function migrateData() {
  const client = new MongoClient(config.mongoUrl, config.options);
  
  try {
    console.log('🚀 Début de la migration vers MongoDB...\n');
    
    // Connexion à MongoDB
    console.log('🔗 Connexion à MongoDB...');
    await client.connect();
    console.log('✅ Connecté à MongoDB\n');
    
    const db = client.db(config.dbName);
    const collection = db.collection(config.collectionName);
    
    // Vérifier si la collection existe déjà et contient des données
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  La collection contient déjà ${existingCount} documents.`);
      console.log('Voulez-vous supprimer les données existantes avant la migration ?');
      console.log('Pour continuer, supprimez manuellement la collection ou modifiez ce script.\n');
      
      // Optionnel: décommenter pour vider automatiquement la collection
      // console.log('🗑️ Suppression des données existantes...');
      // await collection.deleteMany({});
      // console.log('✅ Données supprimées\n');
    }
    
    // Charger le fichier JSON
    const jsonFilePath = path.join(__dirname, '../games_meta.json');
    
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`Fichier non trouvé: ${jsonFilePath}`);
    }
    
    console.log('📂 Chargement du fichier games_meta.json...');
    
    // Configuration pour l'insertion en batch
    const batchSize = 1000;
    let batch = [];
    let totalInserted = 0;
    let totalProcessed = 0;
    
    // Stream de lecture avec JSONStream
    const stream = fs.createReadStream(jsonFilePath, { encoding: 'utf8' })
      .pipe(JSONStream.parse('*'));
    
    // Promesse pour attendre la fin du stream
    await new Promise((resolve, reject) => {
      stream.on('data', async (game) => {
        // Pause le stream pendant l'insertion
        stream.pause();
        
        try {
          totalProcessed++;
          
          // Préparer le document
          if (game && game.appId) {
            const document = {
              appId: game.appId,
              title: game.title || 'Sans titre',
              positive: game.positive || 0,
              negative: game.negative || 0,
              reviewsTotal: game.reviewsTotal || ((game.positive || 0) + (game.negative || 0)),
              price: game.price || null,
              releaseDate: game.releaseDate || null,
              tags: game.tags || [],
              genres: game.genres || [],
              categories: game.categories || [],
              description: game.description || '',
              headerImage: game.headerImage || '',
              developers: game.developers || [],
              publishers: game.publishers || [],
              languages: game.languages || [],
              metacriticScore: game.metacriticScore || null,
              recommendations: game.recommendations || null,
              estimatedOwners: game.estimatedOwners || null,
              averagePlaytime: game.averagePlaytime || 0,
              importedAt: new Date()
            };
            
            batch.push(document);
          }
          
          // Insérer par batch
          if (batch.length >= batchSize) {
            try {
              await collection.insertMany(batch, { ordered: false });
              totalInserted += batch.length;
              console.log(`  ✅ ${totalInserted.toLocaleString()} jeux importés (${totalProcessed.toLocaleString()} traités)...`);
              batch = [];
            } catch (insertError) {
              // Ignorer les erreurs de doublons
              if (insertError.code !== 11000) {
                console.error('  ⚠️ Erreur d\'insertion:', insertError.message);
              }
              batch = [];
            }
          }
          
          // Reprendre le stream
          stream.resume();
        } catch (error) {
          console.error('  ⚠️ Erreur lors du traitement:', error.message);
          stream.resume();
        }
      });
      
      stream.on('end', async () => {
        try {
          // Insérer les documents restants
          if (batch.length > 0) {
            try {
              await collection.insertMany(batch, { ordered: false });
              totalInserted += batch.length;
            } catch (insertError) {
              if (insertError.code !== 11000) {
                console.error('  ⚠️ Erreur d\'insertion finale:', insertError.message);
              }
            }
          }
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
    
    console.log(`\n✅ Migration terminée !`);
    console.log(`📊 Total traité: ${totalProcessed.toLocaleString()} jeux`);
    console.log(`📥 Total importé: ${totalInserted.toLocaleString()} jeux`);
    
    // Créer les index
    console.log('\n📇 Création des index...');
    await collection.createIndex({ appId: 1 }, { unique: true });
    await collection.createIndex({ title: 'text', tags: 'text' });
    await collection.createIndex({ genres: 1 });
    await collection.createIndex({ reviewsTotal: -1 });
    console.log('✅ Index créés');
    
    // Vérification finale
    const finalCount = await collection.countDocuments();
    console.log(`\n✅ Vérification: ${finalCount.toLocaleString()} documents dans MongoDB`);
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

// Exécuter la migration
console.log('═'.repeat(70));
console.log('  MIGRATION DES DONNÉES VERS MONGODB');
console.log('═'.repeat(70));
console.log();

migrateData()
  .then(() => {
    console.log('\n✅ Migration réussie !');
    console.log('💡 Vous pouvez maintenant démarrer le serveur avec: node server.js\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Échec de la migration:', error.message);
    console.error('\n💡 Assurez-vous que MongoDB est en cours d\'exécution:');
    console.error('   - Windows: Ouvrez "Services" et démarrez "MongoDB Server"');
    console.error('   - Ou installez MongoDB depuis: https://www.mongodb.com/try/download/community\n');
    process.exit(1);
  });
