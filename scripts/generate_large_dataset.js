// Script pour générer un jeu de données volumineux pour les tests de charge
const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'steam_games_db_load_test';
const COLLECTION_NAME = 'games';

// Nombre de fois à dupliquer les données (109k * 10 = ~1.1M jeux)
const MULTIPLIER = 10;

async function generateLargeDataset() {
  let sourceClient;
  let targetClient;
  
  try {
    // Connexion à la base source
    console.log('Connexion à MongoDB source...');
    sourceClient = new MongoClient('mongodb://localhost:27017');
    await sourceClient.connect();
    
    // Connexion à la base cible
    console.log('Connexion à MongoDB cible...');
    targetClient = new MongoClient(MONGO_URL);
    await targetClient.connect();
    
    const sourceCollection = sourceClient.db('steam_games_db').collection('games');
    const targetCollection = targetClient.db(DB_NAME).collection(COLLECTION_NAME);
    
    // Compter les documents source
    const sourceCount = await sourceCollection.countDocuments();
    console.log(`\nBase source: ${sourceCount.toLocaleString()} jeux`);
    console.log(`Objectif: ${(sourceCount * MULTIPLIER).toLocaleString()} jeux (x${MULTIPLIER})`);
    
    // Vider la collection cible si elle existe
    const targetCount = await targetCollection.countDocuments();
    if (targetCount > 0) {
      console.log(`\nSuppression de ${targetCount} documents existants...`);
      await targetCollection.deleteMany({});
    }
    
    console.log('\nGeneration des donnees...');
    
    // Dupliquer les données
    let totalInserted = 0;
    const batchSize = 1000;
    
    for (let round = 0; round < MULTIPLIER; round++) {
      console.log(`\nRound ${round + 1}/${MULTIPLIER}`);
      
      const cursor = sourceCollection.find({});
      let batch = [];
      
      for await (const doc of cursor) {
        // Créer une copie avec un nouvel appId unique
        const newDoc = {
          ...doc,
          appId: parseInt(doc.appId) + (round * 10000000), // Décalage pour éviter les doublons
          _id: undefined // Laisser MongoDB générer un nouvel _id
        };
        delete newDoc._id;
        
        batch.push(newDoc);
        
        if (batch.length >= batchSize) {
          await targetCollection.insertMany(batch, { ordered: false });
          totalInserted += batch.length;
          process.stdout.write(`\r   Insere: ${totalInserted.toLocaleString()} / ${(sourceCount * MULTIPLIER).toLocaleString()}`);
          batch = [];
        }
      }
      
      // Insérer le dernier lot
      if (batch.length > 0) {
        await targetCollection.insertMany(batch, { ordered: false });
        totalInserted += batch.length;
        process.stdout.write(`\r   Insere: ${totalInserted.toLocaleString()} / ${(sourceCount * MULTIPLIER).toLocaleString()}`);
      }
    }
    
    console.log('\n\nGeneration terminee !');
    
    // Créer les index
    console.log('\nCreation des index...');
    await targetCollection.createIndex({ appId: 1 }, { unique: true });
    await targetCollection.createIndex({ title: 'text', tags: 'text' });
    await targetCollection.createIndex({ genres: 1 });
    await targetCollection.createIndex({ reviewsTotal: -1 });
    console.log('Index crees');
    
    // Statistiques finales
    const finalCount = await targetCollection.countDocuments();
    const stats = await targetClient.db(DB_NAME).command({ dbStats: 1 });
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('BASE DE DONNEES DE TEST CREEE');
    console.log(`Base: ${DB_NAME}`);
    console.log(`Collection: ${COLLECTION_NAME}`);
    console.log(`Total documents: ${finalCount.toLocaleString()}`);
    console.log(`Taille donnees: ${Math.round(stats.dataSize / 1024 / 1024)} MB`);
    console.log(`Taille stockage: ${Math.round(stats.storageSize / 1024 / 1024)} MB`);
    console.log(`Taille indexes: ${Math.round(stats.indexSize / 1024 / 1024)} MB`);
    console.log(`${'='.repeat(60)}\n`);
    
  } catch (error) {
    console.error('\nErreur:', error.message);
    process.exit(1);
  } finally {
    if (sourceClient) await sourceClient.close();
    if (targetClient) await targetClient.close();
  }
}

generateLargeDataset();
