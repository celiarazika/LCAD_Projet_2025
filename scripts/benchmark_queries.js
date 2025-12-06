// Script pour tester les performances des requêtes MongoDB
const { MongoClient } = require('mongodb');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'steam_games_db';

// Tests à effectuer
const QUERY_TESTS = [
  {
    name: 'Liste simple (20 jeux)',
    query: {},
    options: { limit: 20, sort: { title: 1 } }
  },
  {
    name: 'Liste simple (100 jeux)',
    query: {},
    options: { limit: 100, sort: { title: 1 } }
  },
  {
    name: 'Recherche texte simple',
    query: { title: /action/i },
    options: { limit: 20 }
  },
  {
    name: 'Recherche texte fulltext',
    query: { $text: { $search: 'action adventure' } },
    options: { limit: 20 }
  },
  {
    name: 'Filtre par genre',
    query: { genres: 'Action' },
    options: { limit: 20 }
  },
  {
    name: 'Filtre par prix',
    query: { price_final: { $gte: 0, $lte: 10 } },
    options: { limit: 20 }
  },
  {
    name: 'Filtre score calculé',
    query: {
      $expr: {
        $gte: [
          {
            $cond: [
              { $eq: [{ $add: ['$reviewsPositive', '$reviewsNegative'] }, 0] },
              0,
              {
                $multiply: [
                  { $divide: ['$reviewsPositive', { $add: ['$reviewsPositive', '$reviewsNegative'] }] },
                  100
                ]
              }
            ]
          },
          80
        ]
      }
    },
    options: { limit: 20 }
  },
  {
    name: 'Tri par popularité',
    query: {},
    options: { limit: 20, sort: { reviewsTotal: -1 } }
  },
  {
    name: 'Agrégation stats',
    isAggregation: true,
    pipeline: [
      {
        $facet: {
          totalGames: [{ $count: 'count' }],
          mostReviewed: [
            { $sort: { reviewsTotal: -1 } },
            { $limit: 1 },
            { $project: { title: 1, reviewsTotal: 1 } }
          ]
        }
      }
    ]
  },
  {
    name: 'Requête complexe multi-filtres',
    query: {
      genres: 'Action',
      price_final: { $lte: 30 },
      reviewsTotal: { $gte: 100 }
    },
    options: { limit: 20, sort: { reviewsTotal: -1 } }
  }
];

async function benchmarkQueries() {
  let client;
  
  try {
    console.log('Connexion à MongoDB...');
    client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log('[OK] Connecté\n');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('games');
    
    // Statistiques de la base
    const totalDocs = await collection.countDocuments();
    const stats = await db.command({ dbStats: 1 });
    
    console.log('='.repeat(70));
    console.log('BENCHMARK DES REQUÊTES MONGODB');
    console.log('='.repeat(70));
    console.log(`Base: ${DB_NAME}`);
    console.log(`Documents: ${totalDocs.toLocaleString()}`);
    console.log(`Taille: ${Math.round(stats.dataSize / 1024 / 1024)} MB`);
    console.log('='.repeat(70));
    console.log();
    
    const results = [];
    
    // Exécuter chaque test
    for (const test of QUERY_TESTS) {
      console.log(`\nTest: ${test.name}`);
      console.log(`   Query: ${JSON.stringify(test.query || test.pipeline?.[0] || {}).substring(0, 60)}...`);
      
      const iterations = 10;
      const times = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        
        if (test.isAggregation) {
          await collection.aggregate(test.pipeline).toArray();
        } else {
          await collection.find(test.query, test.options).toArray();
        }
        
        const time = Date.now() - start;
        times.push(time);
        
        process.stdout.write(`\r   Itération ${i + 1}/${iterations}: ${time}ms`);
      }
      
      const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`\n   Moyenne: ${avgTime}ms | Min: ${minTime}ms | Max: ${maxTime}ms`);
      
      // Évaluation
      let status;
      if (avgTime < 50) status = '[OK] RAPIDE';
      else if (avgTime < 200) status = '[OK] BON';
      else if (avgTime < 500) status = '[!] ACCEPTABLE';
      else status = '[ERR] LENT';
      
      console.log(`   ${status}`);
      
      results.push({
        name: test.name,
        avgTime,
        minTime,
        maxTime,
        status
      });
    }
    
    // Résumé
    console.log('\n\n' + '='.repeat(70));
    console.log('RÉSUMÉ DES PERFORMANCES');
    console.log('='.repeat(70));
    
    results.sort((a, b) => a.avgTime - b.avgTime);
    
    console.log('\nClassement par performance:\n');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name}`);
      console.log(`   ${result.status} - ${result.avgTime}ms (min: ${result.minTime}ms, max: ${result.maxTime}ms)`);
    });
    
    // Recommandations
    console.log('\nRecommandations:\n');
    const slowQueries = results.filter(r => r.avgTime > 500);
    if (slowQueries.length > 0) {
      console.log('[ERR] Requêtes à optimiser:');
      slowQueries.forEach(q => console.log(`   - ${q.name} (${q.avgTime}ms)`));
      console.log('\n   Suggestions:');
      console.log('   - Ajouter des index sur les champs filtrés');
      console.log('   - Limiter le nombre de documents retournés');
      console.log('   - Utiliser la projection pour ne récupérer que les champs nécessaires');
    } else {
      console.log('[OK] Toutes les requêtes sont performantes !');
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n[ERR] Erreur:', error.message);
    process.exit(1);
  } finally {
    if (client) await client.close();
  }
}

benchmarkQueries();
