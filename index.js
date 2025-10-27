// Application de gestion des données de jeux Steam
// Utilise une base de données locale au format CSV

// Dépendances
const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse');

// Initialisation d'Express
const app = express();
app.use(express.json());
app.use(express.static('public'));

// Base de données en mémoire
let gamesDatabase = [];

// Fonction pour échapper l'HTML
function escapeHtml(text) {
  if (!text) return '';
  return text.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Fonction pour charger les données CSV
function loadGamesData() {
  return new Promise((resolve, reject) => {
    const csvPath = path.join(__dirname, 'Steam Trends 2023 by @evlko and @Sadari - Games Data.csv');
    const results = [];
    
    fs.createReadStream(csvPath, { encoding: 'utf8' })
      .pipe(csv.parse({ 
        headers: true,
        skipEmptyLines: true,
        delimiter: ',',
        quote: '"',
        escape: '"',
        columns: true,
        trim: true
      }))
      .on('data', (data) => {
        // Nettoyer et structurer les données avec vérifications de sécurité
        const game = {
          appId: data['App ID'] || '',
          title: data['Title'] || 'Titre non disponible',
          reviewsTotal: parseInt(data['Reviews Total']) || 0,
          reviewsScore: data['Reviews Score Fancy'] || 'Non évalué',
          releaseDate: data['Release Date'] || 'Date inconnue',
          launchPrice: data['Launch Price'] || 'Prix non disponible',
          tags: data['Tags'] ? data['Tags'].split(', ').filter(tag => tag.trim() !== '') : [],
          revenueEstimated: data['Revenue Estimated'] || 'Revenus non disponibles',
          steamPage: data['Steam Page'] || '#'
        };
        results.push(game);
      })
      .on('end', () => {
        gamesDatabase = results;
        console.log(`✅ ${results.length} jeux chargés dans la base de données`);
        
        // Debug: afficher les 3 premiers jeux
        if (results.length > 0) {
          console.log('🎮 Premiers jeux chargés:');
          results.slice(0, 3).forEach((game, index) => {
            console.log(`  ${index + 1}. "${game.title}" - Tags: [${game.tags.slice(0, 3).join(', ')}...]`);
          });
        }
        
        resolve(results);
      })
      .on('error', (error) => {
        console.error('❌ Erreur lors du chargement des données:', error);
        reject(error);
      });
  });
}

// Template HTML pour l'interface
const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>Steam Games Database</title>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #1b2838; color: white; }
        .header { text-align: center; margin-bottom: 40px; }
        .stats { background: #2a475e; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .search-box { margin-bottom: 30px; }
        .search-box input { padding: 10px; width: 300px; font-size: 16px; }
        .search-box button { padding: 10px 20px; font-size: 16px; margin-left: 10px; }
        .game-card { background: #2a475e; margin: 10px 0; padding: 15px; border-radius: 8px; display: flex; align-items: flex-start; }
        .game-image { width: 120px; height: 56px; margin-right: 15px; border-radius: 4px; flex-shrink: 0; }
        .game-content { flex: 1; }
        .game-title { font-size: 18px; font-weight: bold; color: #66c0f4; }
        .game-info { margin: 5px 0; font-size: 14px; }
        .tags { margin-top: 10px; }
        .tag { background: #4c6b22; padding: 2px 8px; margin: 2px; border-radius: 3px; font-size: 12px; display: inline-block; }
        .pagination { text-align: center; margin: 20px 0; }
        .pagination a { padding: 8px 16px; margin: 0 4px; background: #2a475e; color: white; text-decoration: none; border-radius: 4px; }
        .pagination .current { background: #66c0f4; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 Base de données Steam Games</h1>
        <p>Explorez plus de 65 000 jeux Steam avec leurs statistiques et tendances</p>
    </div>
    
    <div class="stats">
        <h3>📊 Statistiques</h3>
        <p><strong>Total des jeux:</strong> {totalGames}</p>
        <p><strong>Jeu le plus populaire:</strong> {mostPopular}</p>
        <p><strong>Revenus totaux estimés:</strong> {totalRevenue}</p>
    </div>
    
    <div class="search-box">
        <form method="GET" action="/">
            <input type="text" name="search" placeholder="Rechercher un jeu..." value="{searchQuery}">
            <button type="submit">🔍 Rechercher</button>
            <button type="button" onclick="window.location.href='/'">🔄 Reset</button>
        </form>
    </div>
    
    {gamesList}
    
    {pagination}
</body>
</html>
`;

// Route principale
app.get('/', (req, res) => {
  const search = req.query.search || '';
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  
  console.log(`🔍 Recherche: "${search}", Page: ${page}, DB size: ${gamesDatabase.length}`);
  
  // Filtrer les jeux selon la recherche
  let filteredGames = gamesDatabase;
  if (search) {
    filteredGames = gamesDatabase.filter(game => {
      // Vérifier que le titre existe
      const titleMatch = game.title && game.title.toLowerCase().includes(search.toLowerCase());
      
      // Vérifier que les tags existent et ne sont pas vides
      const tagsMatch = game.tags && Array.isArray(game.tags) && 
        game.tags.some(tag => tag && tag.toLowerCase().includes(search.toLowerCase()));
      
      return titleMatch || tagsMatch;
    });
    console.log(`📊 Résultats trouvés: ${filteredGames.length}`);
  }
  
  // Pagination
  const totalGames = filteredGames.length;
  const paginatedGames = filteredGames.slice(offset, offset + limit);
  
  // Générer la liste des jeux avec vérifications de sécurité
  const gamesList = paginatedGames.map(game => {
    const safeTitle = escapeHtml(game.title || 'Titre non disponible');
    const safeReleaseDate = escapeHtml(game.releaseDate || 'Date inconnue');
    const safeReviewsScore = escapeHtml(game.reviewsScore || 'Non évalué');
    const safeReviewsTotal = game.reviewsTotal || 0;
    const safeLaunchPrice = escapeHtml(game.launchPrice || 'Prix non disponible');
    const safeRevenueEstimated = escapeHtml(game.revenueEstimated || 'Revenus non disponibles');
    const safeTags = game.tags && Array.isArray(game.tags) ? game.tags : [];
    const safeSteamPage = game.steamPage || '#';
    const safeAppId = game.appId || '';
    
    // URL de l'image Steam
    const imageUrl = safeAppId ? 
      `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${safeAppId}/header.jpg` : 
      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="56" viewBox="0 0 120 56"><rect width="120" height="56" fill="%23404040"/><text x="60" y="32" text-anchor="middle" fill="white" font-size="10">Pas d\'image</text></svg>';
    
    return `
    <div class="game-card">
      <img src="${imageUrl}" alt="${safeTitle}" class="game-image" onerror="this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"56\" viewBox=\"0 0 120 56\"><rect width=\"120\" height=\"56\" fill=\"%23404040\"/></svg>'">
      <div class="game-content">
      <div class="game-title">${safeTitle}</div>
      <div class="game-info">📅 <strong>Date de sortie:</strong> ${safeReleaseDate}</div>
      <div class="game-info">⭐ <strong>Score:</strong> ${safeReviewsScore} (${safeReviewsTotal.toLocaleString()} avis)</div>
      <div class="game-info">💰 <strong>Prix de lancement:</strong> ${safeLaunchPrice}</div>
      <div class="game-info">💵 <strong>Revenus estimés:</strong> ${safeRevenueEstimated}</div>
      <div class="tags">
        ${safeTags.slice(0, 10).map(tag => `<span class="tag">${escapeHtml(tag || '')}</span>`).join('')}
      </div>
      <div class="game-info">🔗 <a href="${escapeHtml(safeSteamPage)}" target="_blank" style="color: #66c0f4;">Voir sur Steam</a></div>
      </div>
    </div>
    `;
  }).join('');
  
  // Générer la pagination
  const totalPages = Math.ceil(totalGames / limit);
  let pagination = '<div class="pagination">';
  
  if (page > 1) {
    pagination += `<a href="?search=${search}&page=${page - 1}">« Précédent</a>`;
  }
  
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    if (i === page) {
      pagination += `<a href="?search=${search}&page=${i}" class="current">${i}</a>`;
    } else {
      pagination += `<a href="?search=${search}&page=${i}">${i}</a>`;
    }
  }
  
  if (page < totalPages) {
    pagination += `<a href="?search=${search}&page=${page + 1}">Suivant »</a>`;
  }
  
  pagination += '</div>';
  
  // Calculer les statistiques - avec vérification de sécurité
  let mostPopular = { title: 'Aucun jeu trouvé', reviewsTotal: 0 };
  if (gamesDatabase.length > 0) {
    mostPopular = gamesDatabase.reduce((prev, current) => 
      (prev.reviewsTotal > current.reviewsTotal) ? prev : current
    );
  }
  
  const html = htmlTemplate
    .replace('{totalGames}', gamesDatabase.length.toLocaleString())
    .replace('{mostPopular}', escapeHtml(mostPopular.title))
    .replace('{totalRevenue}', 'Plus de 1 milliard $')
    .replace('{searchQuery}', escapeHtml(search))
    .replace('{gamesList}', gamesList)
    .replace('{pagination}', totalPages > 1 ? pagination : '');
  
  res.send(html);
});

// API endpoint pour récupérer un jeu par ID
app.get('/api/game/:id', (req, res) => {
  const gameId = req.params.id;
  const game = gamesDatabase.find(g => g.appId === gameId);
  
  if (game) {
    res.json(game);
  } else {
    res.status(404).json({ error: 'Jeu non trouvé' });
  }
});

// API endpoint pour rechercher des jeux
app.get('/api/search', (req, res) => {
  const query = req.query.q || '';
  const limit = parseInt(req.query.limit) || 50;
  
  const results = gamesDatabase
    .filter(game => {
      if (!query) return true;
      
      const titleMatch = game.title && game.title.toLowerCase().includes(query.toLowerCase());
      const tagsMatch = game.tags && Array.isArray(game.tags) && 
        game.tags.some(tag => tag && tag.toLowerCase().includes(query.toLowerCase()));
      
      return titleMatch || tagsMatch;
    })
    .slice(0, limit);
  
  res.json({
    query: query,
    total: results.length,
    games: results
  });
});

// API endpoint pour obtenir les statistiques
app.get('/api/stats', (req, res) => {
  const totalGames = gamesDatabase.length;
  const totalReviews = gamesDatabase.reduce((sum, game) => sum + game.reviewsTotal, 0);
  
  let mostReviewed = { title: 'Aucun jeu trouvé', reviewsTotal: 0 };
  if (gamesDatabase.length > 0) {
    mostReviewed = gamesDatabase.reduce((prev, current) => 
      (prev.reviewsTotal > current.reviewsTotal) ? prev : current
    );
  }
  
  // Top 10 des tags les plus populaires
  const tagCounts = {};
  gamesDatabase.forEach(game => {
    if (game.tags && Array.isArray(game.tags)) {
      game.tags.forEach(tag => {
        if (tag) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    }
  });
  
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));
  
  res.json({
    totalGames,
    totalReviews,
    mostReviewed: {
      title: mostReviewed.title,
      reviews: mostReviewed.reviewsTotal
    },
    topTags
  });
});

// Démarrage du serveur
async function startServer() {
  try {
    await loadGamesData();
    
    const PORT = 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
      console.log(`📊 Base de données: ${gamesDatabase.length} jeux chargés`);
      console.log(`🔍 API disponible sur /api/search, /api/game/:id, /api/stats`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
  }
}

startServer();