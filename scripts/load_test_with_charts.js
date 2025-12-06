// Script de test de charge avec export des données pour graphiques
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

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

// Données pour les graphiques
const timeSeriesData = [];
const scenarioStats = {};
let totalRequests = 0;
let successfulRequests = 0;
let failedRequests = 0;
let totalResponseTime = 0;
let minResponseTime = Infinity;
let maxResponseTime = 0;
const responseTimes = [];

// Initialiser les stats par scénario
TEST_SCENARIOS.forEach(scenario => {
  scenarioStats[scenario.name] = {
    count: 0,
    times: [],
    errors: 0
  };
});

// Fonction pour faire une requête HTTP
function makeRequest(url, scenarioName) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const startTime = Date.now();
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({ success: res.statusCode === 200, responseTime, scenarioName });
      });
    }).on('error', () => {
      const responseTime = Date.now() - startTime;
      resolve({ success: false, responseTime, scenarioName });
    });
  });
}

// Simuler un utilisateur
async function simulateUser(userId, startTime) {
  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const scenario = TEST_SCENARIOS[Math.floor(Math.random() * TEST_SCENARIOS.length)];
    const url = `${API_URL}${scenario.path}`;
    
    const result = await makeRequest(url, scenario.name);
    const elapsedTime = Date.now() - startTime;
    
    // Enregistrer dans la série temporelle
    timeSeriesData.push({
      timestamp: elapsedTime,
      responseTime: result.responseTime,
      success: result.success,
      scenario: scenario.name,
      requestNumber: totalRequests + 1
    });
    
    // Statistiques par scénario
    scenarioStats[scenario.name].count++;
    scenarioStats[scenario.name].times.push(result.responseTime);
    if (!result.success) {
      scenarioStats[scenario.name].errors++;
    }
    
    // Statistiques globales
    totalRequests++;
    if (result.success) {
      successfulRequests++;
    } else {
      failedRequests++;
    }
    
    totalResponseTime += result.responseTime;
    responseTimes.push(result.responseTime);
    minResponseTime = Math.min(minResponseTime, result.responseTime);
    maxResponseTime = Math.max(maxResponseTime, result.responseTime);
    
    // Afficher la progression
    if (totalRequests % 10 === 0) {
      const avgTime = Math.round(totalResponseTime / totalRequests);
      process.stdout.write(`\rRequêtes: ${totalRequests}/${CONCURRENT_USERS * REQUESTS_PER_USER} | Succès: ${successfulRequests} | Échecs: ${failedRequests} | Temps moyen: ${avgTime}ms`);
    }
    
    if (DELAY_MS > 0) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
}

// Calculer les percentiles
function getPercentile(arr, percentile) {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

// Générer le fichier HTML avec graphiques
function generateHTMLReport(testDuration) {
  const avgTime = Math.round(totalResponseTime / totalRequests);
  
  // Préparer les données par scénario
  const scenarioLabels = Object.keys(scenarioStats);
  const scenarioAvgTimes = scenarioLabels.map(name => {
    const times = scenarioStats[name].times;
    return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  });
  
  // Données de série temporelle (échantillonnage pour ne pas surcharger)
  const sampledTimeSeries = timeSeriesData.filter((_, i) => i % Math.max(1, Math.floor(timeSeriesData.length / 200)) === 0);
  
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Test de Charge - Steam Games API</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f1923 0%, #1b2838 50%, #2a475e 100%);
            color: #c7d5e0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #66c0f4 0%, #2a75bb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle {
            text-align: center;
            font-size: 1.2em;
            margin-bottom: 30px;
            opacity: 0.8;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(102, 192, 244, 0.2);
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .stat-label {
            font-size: 0.9em;
            opacity: 0.7;
            margin-bottom: 5px;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #66c0f4;
        }
        .stat-unit {
            font-size: 0.6em;
            opacity: 0.8;
        }
        .chart-container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(102, 192, 244, 0.2);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .chart-title {
            font-size: 1.5em;
            margin-bottom: 15px;
            color: #66c0f4;
        }
        canvas {
            max-height: 400px;
        }
        .status {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            margin-top: 10px;
        }
        .status.excellent { background: rgba(76, 175, 80, 0.3); color: #4caf50; }
        .status.good { background: rgba(102, 192, 244, 0.3); color: #66c0f4; }
        .status.warning { background: rgba(255, 152, 0, 0.3); color: #ff9800; }
        .status.poor { background: rgba(244, 67, 54, 0.3); color: #f44336; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Rapport de Test de Charge</h1>
        <div class="subtitle">API Steam Games - ${new Date().toLocaleString('fr-FR')}</div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Requêtes</div>
                <div class="stat-value">${totalRequests}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Taux de Succès</div>
                <div class="stat-value">${Math.round(successfulRequests/totalRequests*100)}<span class="stat-unit">%</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Temps Moyen</div>
                <div class="stat-value">${avgTime}<span class="stat-unit">ms</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Req/sec</div>
                <div class="stat-value">${Math.round(totalRequests/(testDuration/1000))}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Temps Min</div>
                <div class="stat-value">${minResponseTime}<span class="stat-unit">ms</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Temps Max</div>
                <div class="stat-value">${maxResponseTime}<span class="stat-unit">ms</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Médiane (p50)</div>
                <div class="stat-value">${getPercentile(responseTimes, 50)}<span class="stat-unit">ms</span></div>
            </div>
            <div class="stat-card">
                <div class="stat-label">p95</div>
                <div class="stat-value">${getPercentile(responseTimes, 95)}<span class="stat-unit">ms</span></div>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-label">Évaluation Globale</div>
            ${avgTime < 100 ? '<div class="status excellent"> EXCELLENT</div>' :
              avgTime < 300 ? '<div class="status good"> BON</div>' :
              avgTime < 1000 ? '<div class="status warning">ACCEPTABLE</div>' :
              '<div class="status poor">LENT</div>'}
            ${failedRequests === 0 ? '<div class="status excellent">STABLE - Aucune erreur</div>' :
              failedRequests / totalRequests < 0.01 ? '<div class="status warning">Quelques erreurs</div>' :
              '<div class="status poor">INSTABLE</div>'}
        </div>

        <div class="chart-container">
            <div class="chart-title">Temps de réponse dans le temps</div>
            <canvas id="timeSeriesChart"></canvas>
        </div>

        <div class="chart-container">
            <div class="chart-title">Performance par type de requête</div>
            <canvas id="scenarioChart"></canvas>
        </div>

        <div class="chart-container">
            <div class="chart-title">Distribution des temps de réponse</div>
            <canvas id="distributionChart"></canvas>
        </div>

        <div class="chart-container">
            <div class="chart-title"> Percentiles</div>
            <canvas id="percentileChart"></canvas>
        </div>
    </div>

    <script>
        // Configuration globale des graphiques
        Chart.defaults.color = '#c7d5e0';
        Chart.defaults.borderColor = 'rgba(102, 192, 244, 0.2)';

        // Graphique série temporelle
        new Chart(document.getElementById('timeSeriesChart'), {
            type: 'line',
            data: {
                labels: ${JSON.stringify(sampledTimeSeries.map(d => Math.round(d.timestamp / 1000)))},
                datasets: [{
                    label: 'Temps de réponse (ms)',
                    data: ${JSON.stringify(sampledTimeSeries.map(d => d.responseTime))},
                    borderColor: '#66c0f4',
                    backgroundColor: 'rgba(102, 192, 244, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true },
                    tooltip: { mode: 'index', intersect: false }
                },
                scales: {
                    x: { title: { display: true, text: 'Temps écoulé (secondes)' } },
                    y: { title: { display: true, text: 'Temps de réponse (ms)' }, beginAtZero: true }
                }
            }
        });

        // Graphique par scénario
        new Chart(document.getElementById('scenarioChart'), {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(scenarioLabels)},
                datasets: [{
                    label: 'Temps moyen (ms)',
                    data: ${JSON.stringify(scenarioAvgTimes)},
                    backgroundColor: 'rgba(102, 192, 244, 0.6)',
                    borderColor: '#66c0f4',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { title: { display: true, text: 'Temps moyen (ms)' }, beginAtZero: true }
                }
            }
        });

        // Distribution (histogramme)
        const bucketSize = 100;
        const maxBucket = Math.ceil(${maxResponseTime} / bucketSize) * bucketSize;
        const buckets = Array(Math.ceil(maxBucket / bucketSize)).fill(0);
        ${JSON.stringify(responseTimes)}.forEach(time => {
            const bucket = Math.floor(time / bucketSize);
            if (bucket < buckets.length) buckets[bucket]++;
        });

        new Chart(document.getElementById('distributionChart'), {
            type: 'bar',
            data: {
                labels: buckets.map((_, i) => i * bucketSize + '-' + (i + 1) * bucketSize),
                datasets: [{
                    label: 'Nombre de requêtes',
                    data: buckets,
                    backgroundColor: 'rgba(42, 117, 187, 0.6)',
                    borderColor: '#2a75bb',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { title: { display: true, text: 'Temps de réponse (ms)' } },
                    y: { title: { display: true, text: 'Fréquence' }, beginAtZero: true }
                }
            }
        });

        // Percentiles
        const percentiles = [50, 75, 90, 95, 99];
        const percentileValues = percentiles.map(p => {
            const sorted = ${JSON.stringify(responseTimes)}.sort((a, b) => a - b);
            const index = Math.ceil((p / 100) * sorted.length) - 1;
            return sorted[index];
        });

        new Chart(document.getElementById('percentileChart'), {
            type: 'line',
            data: {
                labels: percentiles.map(p => 'p' + p),
                datasets: [{
                    label: 'Temps de réponse (ms)',
                    data: percentileValues,
                    borderColor: '#66c0f4',
                    backgroundColor: 'rgba(102, 192, 244, 0.2)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { title: { display: true, text: 'Temps de réponse (ms)' }, beginAtZero: true }
                }
            }
        });
    </script>
</body>
</html>`;

  return html;
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
    users.push(simulateUser(i, startTime));
  }
  
  await Promise.all(users);
  
  const totalTime = Date.now() - startTime;
  
  // Préparer les données échantillonnées pour le JSON
  const sampledTimeSeries = timeSeriesData.filter((_, i) => i % Math.max(1, Math.floor(timeSeriesData.length / 200)) === 0);
  
  // Générer le rapport HTML
  const html = generateHTMLReport(totalTime);
  const reportPath = path.join(__dirname, '..', 'load_test_report.html');
  fs.writeFileSync(reportPath, html);
  console.log(`Rapport généré: ${reportPath}`);
  
  // Exporter les données brutes en JSON
  const jsonData = {
    config: {
      url: API_URL,
      concurrentUsers: CONCURRENT_USERS,
      requestsPerUser: REQUESTS_PER_USER,
      totalRequests: totalRequests,
      duration: totalTime
    },
    summary: {
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: Math.round(successfulRequests/totalRequests*100),
      avgResponseTime: Math.round(totalResponseTime/totalRequests),
      minResponseTime,
      maxResponseTime,
      median: getPercentile(responseTimes, 50),
      p95: getPercentile(responseTimes, 95),
      p99: getPercentile(responseTimes, 99),
      requestsPerSecond: Math.round(totalRequests/(totalTime/1000))
    },
    scenarioStats,
    timeSeriesData: sampledTimeSeries
  };
  
  const jsonPath = path.join(__dirname, '..', 'load_test_data.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
  console.log(`Données JSON exportées: ${jsonPath}`);
  
  console.log('\n' + '='.repeat(70));
  console.log('TEST TERMINÉ');
  console.log('='.repeat(70) + '\n');
}

runLoadTest().catch(console.error);
