// Script de test de charge HTTP pour l'API
const https = require('https');
const http = require('http');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS) || 10;
const REQUESTS_PER_USER = parseInt(process.env.REQUESTS_PER_USER) || 20;
const DELAY_MS = parseInt(process.env.DELAY_MS) || 100;

// Scénarios de test
const TEST_SCENARIOS = [
  { name: 'Liste simple', path: '/api/games?limit=20' },
  { name: 'Recherche texte', path: '/api/games?search=action&limit=20' },
  { name: 'Filtre genre', path: '/api/games?genre=Action&limit=20' },
  { name: 'Filtre prix', path: '/api/games?priceMin=0&priceMax=10&limit=20' },
  { name: 'Filtre score', path: '/api/games?scoreMin=80&limit=20' },
  { name: 'Tri popularité', path: '/api/games?sort=popularity&order=desc&limit=20' },
  { name: 'Statistiques', path: '/api/stats' },
  { name: 'Genres', path: '/api/genres' }
];

// Statistiques
let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let totalResponseTime = 0;
let minResponseTime = Infinity;
let maxResponseTime = 0;
const responseTimes = [];

// Fonction pour faire une requête HTTP
function makeRequest(url) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const startTime = Date.now();
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({ success: res.statusCode === 200, responseTime });
      });
    }).on('error', () => {
      const responseTime = Date.now() - startTime;
      resolve({ success: false, responseTime });
    });
  });
}

// Simuler un utilisateur
async function simulateUser(userId) {
  const userStats = { requests: 0, successful: 0, failed: 0, times: [] };
  
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    // Choisir un scénario aléatoire
    const scenario = TEST_SCENARIOS[Math.floor(Math.random() * TEST_SCENARIOS.length)];
    const url = `${API_URL}${scenario.path}`;
    
    const result = await makeRequest(url);
    
    userStats.requests++;
    userStats.times.push(result.responseTime);
    
    if (result.success) {
      userStats.successful++;
      successfulRequests++;
    } else {
      userStats.failed++;
      failedRequests++;
    }
    
    totalRequests++;
    totalResponseTime += result.responseTime;
    responseTimes.push(result.responseTime);
    minResponseTime = Math.min(minResponseTime, result.responseTime);
    maxResponseTime = Math.max(maxResponseTime, result.responseTime);
    
    // Afficher la progression
    if (totalRequests % 10 === 0) {
      const avgTime = Math.round(totalResponseTime / totalRequests);
      process.stdout.write(`\r[Stats] Requêtes: ${totalRequests}/${CONCURRENT_USERS * REQUESTS_PER_USER} | Succès: ${successfulRequests} | Échecs: ${failedRequests} | Temps moyen: ${avgTime}ms`);
    }
    
    // Délai entre les requêtes
    if (DELAY_MS > 0) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  return userStats;
}

// Calculer les percentiles
function getPercentile(arr, percentile) {
  const sorted = arr.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

// Fonction principale
async function runLoadTest() {
  console.log(`${'='.repeat(70)}`);
  console.log('TEST DE CHARGE - API STEAM GAMES');
  console.log(`${'='.repeat(70)}`);
  console.log(`URL: ${API_URL}`);
  console.log(`Utilisateurs concurrents: ${CONCURRENT_USERS}`);
  console.log(`Requêtes par utilisateur: ${REQUESTS_PER_USER}`);
  console.log(`Total requêtes: ${CONCURRENT_USERS * REQUESTS_PER_USER}`);
  console.log(`Délai entre requêtes: ${DELAY_MS}ms`);
  console.log(`${'='.repeat(70)}\n`);
  
  const startTime = Date.now();
  
  // Lancer les utilisateurs simultanés
  const users = [];
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    users.push(simulateUser(i));
  }
  
  await Promise.all(users);
  
  const totalTime = Date.now() - startTime;
  
  // Afficher les résultats
  console.log('\n\n' + '='.repeat(70));
  console.log('RÉSULTATS DU TEST DE CHARGE');
  console.log('='.repeat(70));
  console.log(`\n[Statistiques générales]:`);
  console.log(`   Total requêtes:      ${totalRequests}`);
  console.log(`   Succès:              ${successfulRequests} (${Math.round(successfulRequests/totalRequests*100)}%)`);
  console.log(`   Échecs:              ${failedRequests} (${Math.round(failedRequests/totalRequests*100)}%)`);
  console.log(`   Durée totale:        ${Math.round(totalTime/1000)}s`);
  console.log(`   Requêtes/seconde:    ${Math.round(totalRequests/(totalTime/1000))}`);
  
  console.log(`\n[Temps de réponse]:`);
  console.log(`   Minimum:             ${minResponseTime}ms`);
  console.log(`   Maximum:             ${maxResponseTime}ms`);
  console.log(`   Moyenne:             ${Math.round(totalResponseTime/totalRequests)}ms`);
  console.log(`   Médiane (p50):       ${getPercentile(responseTimes, 50)}ms`);
  console.log(`   p95:                 ${getPercentile(responseTimes, 95)}ms`);
  console.log(`   p99:                 ${getPercentile(responseTimes, 99)}ms`);
  
  // Évaluation des performances
  const avgTime = totalResponseTime / totalRequests;
  console.log(`\n[Évaluation]:`);
  if (avgTime < 100) {
    console.log(`   EXCELLENT - Temps de réponse < 100ms`);
  } else if (avgTime < 300) {
    console.log(`   BON - Temps de réponse < 300ms`);
  } else if (avgTime < 1000) {
    console.log(`   ACCEPTABLE - Temps de réponse < 1s`);
  } else {
    console.log(`   LENT - Temps de réponse > 1s`);
  }
  
  if (failedRequests === 0) {
    console.log(`   STABLE - Aucune erreur`);
  } else if (failedRequests / totalRequests < 0.01) {
    console.log(`   ATTENTION - ${Math.round(failedRequests/totalRequests*100)}% d'erreurs`);
  } else {
    console.log(`   INSTABLE - ${Math.round(failedRequests/totalRequests*100)}% d'erreurs`);
  }
  
  console.log(`\n${'='.repeat(70)}\n`);
}

// Exécuter le test
runLoadTest().catch(console.error);
