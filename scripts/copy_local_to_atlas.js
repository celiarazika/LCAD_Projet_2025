// Script pour copier les données de MongoDB local vers MongoDB Atlas
const { MongoClient } = require('mongodb');

// URLs de connexion
const LOCAL_MONGO_URL = 'mongodb://localhost:27017';
const ATLAS_MONGO_URL = 'mongodb+srv://celiamakhlou_db_user:091203Celia@cluster0.tn44ynk.mongodb.net/?appName=Cluster0';
const DB_NAME = 'steam_games_db';
const COLLECTION_NAME = 'games';

async function copyData() {
  let localClient;
  let atlasClient;
  
  try {
    // Connexion à MongoDB local
    console.log('Connexion à MongoDB local...');
    localClient = new MongoClient(LOCAL_MONGO_URL);
    await localClient.connect();
    console.log('✓ Connecté à MongoDB local');
    
    // Connexion à MongoDB Atlas
    console.log('Connexion à MongoDB Atlas...');
    atlasClient = new MongoClient(ATLAS_MONGO_URL);
    await atlasClient.connect();
    console.log('✓ Connecté à MongoDB Atlas');
    
    // Collections source et destination
    const localCollection = localClient.db(DB_NAME).collection(COLLECTION_NAME);
    const atlasCollection = atlasClient.db(DB_NAME).collection(COLLECTION_NAME);
    
    // Compter les documents dans la source
    const totalDocs = await localCollection.countDocuments();
    console.log(`\n📊 Total de jeux à copier: ${totalDocs}`);
    
    // Vérifier si Atlas contient déjà des données
    const existingCount = await atlasCollection.countDocuments();
    if (existingCount > 0) {
      console.log(`\n⚠️  MongoDB Atlas contient déjà ${existingCount} documents.`);
      console.log('Suppression des données existantes dans 2 secondes... (Ctrl+C pour annuler)');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Suppression...');
      await atlasCollection.deleteMany({});
      console.log('✓ Données existantes supprimées');
    }
    
    // Copier par lots avec un cursor
    console.log('\n🚀 Début de la copie...');
    const batchSize = 1000;
    let copied = 0;
    let batch = [];
    
    const cursor = localCollection.find({});
    
    for await (const doc of cursor) {
      // Retirer l'_id pour éviter les conflits
      delete doc._id;
      batch.push(doc);
      
      if (batch.length >= batchSize) {
        try {
          await atlasCollection.insertMany(batch, { ordered: false });
          copied += batch.length;
          const progress = Math.round((copied / totalDocs) * 100);
          process.stdout.write(`\r✓ Copié: ${copied}/${totalDocs} jeux (${progress}%)`);
          batch = [];
        } catch (error) {
          if (!error.message.includes('duplicate key')) {
            console.error('\n❌ Erreur:', error.message);
          }
          copied += batch.length;
          batch = [];
        }
      }
    }
    
    // Insérer le dernier lot
    if (batch.length > 0) {
      try {
        await atlasCollection.insertMany(batch, { ordered: false });
        copied += batch.length;
      } catch (error) {
        if (!error.message.includes('duplicate key')) {
          console.error('\n❌ Erreur:', error.message);
        }
      }
    }
    
    console.log('\n\n✓ Copie terminée !');
    
    // Créer les index sur Atlas
    console.log('\nCréation des index sur Atlas...');
    await atlasCollection.createIndex({ appId: 1 }, { unique: true });
    await atlasCollection.createIndex({ title: 'text', tags: 'text' });
    await atlasCollection.createIndex({ genres: 1 });
    await atlasCollection.createIndex({ reviewsTotal: -1 });
    console.log('✓ Index créés');
    
    // Statistiques finales
    const finalCount = await atlasCollection.countDocuments();
    console.log(`\n${'='.repeat(60)}`);
    console.log('COPIE RÉUSSIE');
    console.log(`Total: ${finalCount} jeux copiés vers MongoDB Atlas`);
    console.log(`Base: ${DB_NAME}`);
    console.log(`Collection: ${COLLECTION_NAME}`);
    console.log(`${'='.repeat(60)}\n`);
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (localClient) {
      await localClient.close();
      console.log('Connexion locale fermée.');
    }
    if (atlasClient) {
      await atlasClient.close();
      console.log('Connexion Atlas fermée.');
    }
  }
}

// Exécuter la copie
copyData();
