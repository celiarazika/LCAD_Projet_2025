

// Dépendances
const express = require('express');
const fs = require('fs');
const path = require('path');
const JSONStream = require('JSONStream');

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

// Fonction pour charger les données JSON avec streaming
function loadGamesData() {
  return new Promise((resolve, reject) => {
    const jsonPath = path.join(__dirname, 'games_meta.json');
    
    if (!fs.existsSync(jsonPath)) {
      reject(new Error(`Fichier non trouvé: ${jsonPath}`));
      return;
    }
    
    const results = [];
    let count = 0;
    
    fs.createReadStream(jsonPath, { encoding: 'utf8' })
      .pipe(JSONStream.parse('*'))
      .on('data', (game) => {
        if (game && game.appId) {
          results.push(game);
          count++;
          if (count % 50000 === 0) {
            console.log(`  📥 ${count} jeux chargés...`);
          }
        }
      })
      .on('end', () => {
        gamesDatabase = results;
        console.log(`✅ ${gamesDatabase.length} jeux chargés dans la base de données`);
        
        // Debug: afficher les 3 premiers jeux
        if (gamesDatabase.length > 0) {
          console.log('🎮 Premiers jeux chargés:');
          gamesDatabase.slice(0, 3).forEach((game, index) => {
            const tagsStr = game.tags && Array.isArray(game.tags) && game.tags.length > 0
              ? game.tags.slice(0, 3).join(', ')
              : 'Pas de tags';
            console.log(`  ${index + 1}. "${game.title}" - ${tagsStr}`);
          });
        }
        
        resolve(gamesDatabase);
      })
      .on('error', (error) => {
        console.error('❌ Erreur lors du chargement des données:', error);
        reject(error);
      });
  });
}

// interface
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
        .search-box { margin-bottom: 30px; background: #2a475e; padding: 20px; border-radius: 8px; }
        .search-row { margin-bottom: 15px; display: flex; gap: 10px; }
        .search-row input { padding: 10px; flex: 1; font-size: 16px; border: 1px solid #66c0f4; background: #1b2838; color: white; border-radius: 4px; }
        .filters-row { display: flex; gap: 15px; flex-wrap: wrap; align-items: flex-end; }
        .filter-group { display: flex; flex-direction: column; }
        .filter-group label { font-size: 12px; color: #a3aaaf; margin-bottom: 5px; font-weight: bold; }
        .filter-group input, .filter-group select { padding: 8px; font-size: 14px; border: 1px solid #66c0f4; background: #1b2838; color: white; border-radius: 4px; min-width: 150px; }
        .filter-group select { cursor: pointer; }
        .filter-group select option { background: #1b2838; color: white; padding: 5px; }
        .search-box button { padding: 10px 20px; font-size: 14px; background: #66c0f4; color: white; border: none; border-radius: 4px; cursor: pointer; }
        .search-box button:hover { background: #82d5f7; }
        .game-card { background: #2a475e; margin: 10px 0; padding: 15px; border-radius: 8px; display: flex; align-items: flex-start; }
        .game-image { width: 240px; height: 135px; margin-right: 15px; border-radius: 4px; flex-shrink: 0; object-fit: cover; }
        .game-content { flex: 1; }
        .game-title { font-size: 18px; font-weight: bold; color: #66c0f4; }
        .game-info { margin: 5px 0; font-size: 14px; }
        .tags { margin-top: 10px; }
        .tag { background: #4c6b22; padding: 2px 8px; margin: 2px; border-radius: 3px; font-size: 12px; display: inline-block; }
        .pagination { text-align: center; margin: 20px 0; }
        .pagination a { padding: 8px 16px; margin: 0 4px; background: #2a475e; color: white; text-decoration: none; border-radius: 4px; }
        .pagination .current { background: #66c0f4; }
        .admin-section { background: #2a475e; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .admin-form { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
        .admin-form input, .admin-form textarea { padding: 10px; background: #1b2838; color: white; border: 1px solid #66c0f4; border-radius: 4px; width: 100%; }
        .admin-form textarea { grid-column: 1 / -1; min-height: 80px; }
        .admin-form button { grid-column: 1 / -1; padding: 12px; background: #66c0f4; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold; }
        .admin-form button:hover { background: #82d5f7; }
        .delete-btn { background: #d32f2f; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 10px; }
        .delete-btn:hover { background: #f44336; }
        .toggle-admin { background: #66c0f4; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-bottom: 10px; }
        .toggle-admin:hover { background: #82d5f7; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Base de données Steam Games</h1>
        <p>Explorez plus de 100 000 jeux Steam avec leurs statistiques et tendances</p>
    </div>
    
    <div class="stats">
        <h3>📊 Statistiques</h3>
        <p><strong>Total des jeux:</strong> {totalGames}</p>
        <p><strong>Jeu le plus populaire:</strong> {mostPopular}</p>
        <p><strong>Revenus totaux estimés:</strong> {totalRevenue}</p>
    </div>
    
    <button class="toggle-admin" onclick="document.getElementById('admin-section').style.display = document.getElementById('admin-section').style.display === 'none' ? 'block' : 'none'">
        🔧 Afficher/Masquer l'administration
    </button>
    
    <div id="admin-section" class="admin-section" style="display: none;">
        <h3>➕ Ajouter un nouveau jeu</h3>
        <form class="admin-form" id="add-game-form">
            <input type="text" name="title" placeholder="Titre du jeu *" required>
            <input type="text" name="appId" placeholder="App ID (optionnel)">
            <input type="number" name="positive" placeholder="Avis positifs" value="0">
            <input type="number" name="negative" placeholder="Avis négatifs" value="0">
            <input type="number" step="0.01" name="price" placeholder="Prix (ex: 19.99)">
            <input type="text" name="releaseDate" placeholder="Date de sortie (ex: Jan 1, 2024)">
            <input type="text" name="genres" placeholder="Genres (séparés par virgule)">
            <input type="text" name="tags" placeholder="Tags (séparés par virgule)">
            <input type="text" name="developers" placeholder="Développeur">
            <input type="text" name="publishers" placeholder="Éditeur">
            <textarea name="description" placeholder="Description courte"></textarea>
            <button type="submit">Ajouter le jeu</button>
        </form>
    </div>
    
    <div class="search-box">
        <form method="GET" action="/">
            <div class="search-row">
                <input type="text" name="search" placeholder="Rechercher un jeu..." value="{searchQuery}">
                <button type="submit">🔍 Rechercher</button>
            </div>
            
            <div class="filters-row">
                <div class="filter-group">
                    <label for="genre">Genre:</label>
                    <select id="genre" name="genre">
                        <option value="">-- Tous les genres --</option>
                        {genreOptions}
                    </select>
                </div>
                
                <div class="filter-group">
                    <label for="sort">Trier par:</label>
                    <select id="sort" name="sort">
                        <option value="title"{sortTitle}>Titre (A-Z)</option>
                        <option value="score"{sortScore}>Score</option>
                        <option value="price"{sortPrice}>Prix</option>
                        <option value="date"{sortDate}>Date de sortie</option>
                        <option value="reviews"{sortReviews}>Nombre d'avis</option>
                        <option value="popularity"{sortPopularity}>Popularité</option>
                    </select>
                </div>
                
                <div class="filter-group">
                    <label for="order">Ordre:</label>
                    <select id="order" name="order">
                        <option value="asc"{orderAsc}>Croissant ↑</option>
                        <option value="desc"{orderDesc}>Décroissant ↓</option>
                    </select>
                </div>
                
                <button type="button" onclick="window.location.href='/'">Reset</button>
            </div>
        </form>
    </div>
    
    {gamesList}
    
    {pagination}
    
    <script>
        async function addGame(event) {
            event.preventDefault();
            console.log('Fonction addGame appelée');
            
            const form = event.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            console.log('Données du formulaire:', data);
            
            try {
                const response = await fetch('/api/game/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                console.log('Réponse reçue:', response.status);
                const result = await response.json();
                console.log('Result:', result);
                
                if (result.success) {
                    alert('✅ Jeu ajouté avec succès!');
                    form.reset();
                    window.location.reload();
                } else {
                    alert('❌ Erreur: ' + result.message);
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('❌ Erreur lors de l\'ajout du jeu: ' + error.message);
            }
        }
        
        async function deleteGame(appId) {
            if (!confirm('Êtes-vous sûr de vouloir supprimer ce jeu?')) {
                return;
            }
            
            console.log('Suppression du jeu:', appId);
            
            try {
                const response = await fetch('/api/game/' + encodeURIComponent(appId), {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Jeu supprimé avec succès!');
                    window.location.reload();
                } else {
                    alert('❌ Erreur: ' + result.message);
                }
            } catch (error) {
                console.error('Erreur:', error);
                alert('❌ Erreur lors de la suppression: ' + error.message);
            }
        }
        
        // Ajouter les event listeners au chargement de la page
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM chargé, ajout des event listeners');
            
            // Event listener pour le formulaire d'ajout
            const addForm = document.getElementById('add-game-form');
            if (addForm) {
                addForm.addEventListener('submit', addGame);
                console.log('Event listener ajouté au formulaire');
            } else {
                console.error('Formulaire d\'ajout non trouvé');
            }
            
            // Event listeners pour les boutons de suppression
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const gameId = this.getAttribute('data-game-id');
                    deleteGame(gameId);
                });
            });
            console.log('Event listeners ajoutés aux boutons de suppression');
        });
    </script>
</body>
</html>
`;

// Route principale
app.get('/', (req, res) => {
  const search = req.query.search || '';
  const genre = req.query.genre || '';
  const sort = req.query.sort || 'title';
  const order = req.query.order || 'asc';
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  
  console.log(`🔍 Recherche: "${search}", Genre: "${genre}", Tri: ${sort} (${order}), Page: ${page}`);
  
  // Extraire les genres uniques de la base de données
  const allGenres = new Set();
  gamesDatabase.forEach(game => {
    if (game.genres && Array.isArray(game.genres)) {
      game.genres.forEach(g => {
        if (g) {
          allGenres.add(g);
        }
      });
    }
  });
  const uniqueGenres = Array.from(allGenres).sort();
  
  // Filtrer les jeux selon la recherche et le genre
  let filteredGames = gamesDatabase;
  if (search || genre) {
    filteredGames = gamesDatabase.filter(game => {
      // Filtre par titre ou tags
      let matchesSearch = true;
      if (search) {
        const titleMatch = game.title && game.title.toLowerCase().includes(search.toLowerCase());
        const tagsMatch = game.tags && Array.isArray(game.tags) && 
          game.tags.some(tag => tag && tag.toLowerCase().includes(search.toLowerCase()));
        matchesSearch = titleMatch || tagsMatch;
      }
      
      // Filtre par genre (correspondance exacte)
      let matchesGenre = true;
      if (genre) {
        matchesGenre = game.genres && Array.isArray(game.genres) &&
          game.genres.some(g => g && g.toLowerCase() === genre.toLowerCase());
      }
      
      return matchesSearch && matchesGenre;
    });
    console.log(`Résultats trouvés: ${filteredGames.length}`);
  }
  
  // Tri des jeux
  filteredGames.sort((a, b) => {
    let compareA, compareB;
    let isNumeric = false;
    
    switch(sort) {
      case 'title':
        compareA = (a.title || '').toLowerCase();
        compareB = (b.title || '').toLowerCase();
        break;
      case 'score':
        // Calculer le pourcentage positif pour chaque jeu
        const totalA = (a.positive || 0) + (a.negative || 0);
        const totalB = (b.positive || 0) + (b.negative || 0);
        compareA = totalA > 0 ? ((a.positive || 0) / totalA) * 100 : 0;
        compareB = totalB > 0 ? ((b.positive || 0) / totalB) * 100 : 0;
        isNumeric = true;
        break;
      case 'price':
        compareA = a.price || 0;
        compareB = b.price || 0;
        isNumeric = true;
        break;
      case 'date':
        compareA = a.releaseDate || '0000-00-00';
        compareB = b.releaseDate || '0000-00-00';
        break;
      case 'reviews':
        compareA = a.reviewsTotal || 0;
        compareB = b.reviewsTotal || 0;
        isNumeric = true;
        break;
      case 'popularity':
        // Popularité basée sur le nombre total d'avis
        compareA = a.reviewsTotal || 0;
        compareB = b.reviewsTotal || 0;
        isNumeric = true;
        break;
      default:
        compareA = (a.title || '').toLowerCase();
        compareB = (b.title || '').toLowerCase();
    }
    
    // Pour les nombres, utiliser la soustraction
    if (isNumeric) {
      const diff = compareA - compareB;
      return order === 'asc' ? diff : -diff;
    }
    
    // Pour les chaînes, utiliser la comparaison
    if (compareA < compareB) {
      return order === 'asc' ? -1 : 1;
    } else if (compareA > compareB) {
      return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  // Pagination
  const totalGames = filteredGames.length;
  const paginatedGames = filteredGames.slice(offset, offset + limit);
  
  // Générer la liste des jeux avec vérifications de sécurité
  const gamesList = paginatedGames.map(game => {
    const safeTitle = escapeHtml(game.title || 'Titre non disponible');
    const safeReleaseDate = escapeHtml(game.releaseDate || 'Date inconnue');
    const safePrice = game.price ? `${game.price}$` : 'Prix non disponible';
    const safeReviewsTotal = game.reviewsTotal || 0;
    const safePositive = game.positive || 0;
    const safeNegative = game.negative || 0;
    const safeTags = game.tags && Array.isArray(game.tags) ? game.tags : [];
    const safeAppId = game.appId || '';
    const safeGenres = game.genres && Array.isArray(game.genres) ? game.genres : [];
    const safeMetacriticScore = game.metacriticScore || 'N/A';
    
    // URL de l'image Steam
    const imageUrl = safeAppId ? 
      `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${safeAppId}/header.jpg` : 
      'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2256%22 viewBox=%220 0 120 56%22%3E%3Crect width=%22120%22 height=%2256%22 fill=%22%23404040%22/%3E%3C/svg%3E';
    
    // Calculer le pourcentage de reviews positives
    const positivePercentage = safeReviewsTotal > 0 
      ? Math.round((safePositive / safeReviewsTotal) * 100) 
      : 0;
    
    // Génération sécurisée des tags
    const tagsHtml = safeTags.slice(0, 10)
      .map(tag => `<span class="tag">${escapeHtml(tag || '')}</span>`)
      .join('');
    
    // Génération sécurisée des genres
    const genresText = safeGenres.slice(0, 3)
      .map(g => escapeHtml(g))
      .join(', ') || 'Non spécifiés';
    
    return `<div class="game-card">
      <img src="${escapeHtml(imageUrl)}" alt="${safeTitle}" class="game-image" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2256%22%3E%3Crect width=%22120%22 height=%2256%22 fill=%22%23404040%22/%3E%3C/svg%3E'">
      <div class="game-content">
        <div class="game-title">${safeTitle}</div>
        <div class="game-info">📅 <strong>Date de sortie:</strong> ${safeReleaseDate}</div>
        <div class="game-info">⭐ <strong>Score:</strong> ${positivePercentage}% positif (${safeReviewsTotal.toLocaleString()} avis)</div>
        <div class="game-info">💰 <strong>Prix:</strong> ${safePrice}</div>
        <div class="game-info">🎮 <strong>Genres:</strong> ${genresText}</div>
        <div class="tags">${tagsHtml}</div>
        <div class="game-info">🔗 <a href="https://steamcommunity.com/app/${escapeHtml(safeAppId)}" target="_blank" style="color: #66c0f4;">Voir sur Steam</a></div>
        <button class="delete-btn" data-game-id="${safeAppId}">🗑️ Supprimer ce jeu</button>
      </div>
    </div>`;
  }).join('');
  
  // Générer la pagination
  const totalPages = Math.ceil(totalGames / limit);
  let pagination = '<div class="pagination">';
  
  const filterParams = new URLSearchParams();
  if (search) filterParams.append('search', search);
  if (genre) filterParams.append('genre', genre);
  if (sort !== 'title') filterParams.append('sort', sort);
  if (order !== 'asc') filterParams.append('order', order);
  const filterString = filterParams.toString();
  const separator = filterString ? '&' : '';
  
  if (page > 1) {
    pagination += `<a href="?${filterString}${separator}page=${page - 1}">« Précédent</a>`;
  }
  
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    if (i === page) {
      pagination += `<a href="?${filterString}${separator}page=${i}" class="current">${i}</a>`;
    } else {
      pagination += `<a href="?${filterString}${separator}page=${i}">${i}</a>`;
    }
  }
  
  if (page < totalPages) {
    pagination += `<a href="?${filterString}${separator}page=${page + 1}">Suivant »</a>`;
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
    .replace('{genreOptions}', uniqueGenres.map(g => {
      const isSelected = genre === g ? 'selected' : '';
      return `<option value="${escapeHtml(g)}" ${isSelected}>${escapeHtml(g)}</option>`;
    }).join('\n'))
    .replace('{sortTitle}', sort === 'title' ? ' selected' : '')
    .replace('{sortScore}', sort === 'score' ? ' selected' : '')
    .replace('{sortPrice}', sort === 'price' ? ' selected' : '')
    .replace('{sortDate}', sort === 'date' ? ' selected' : '')
    .replace('{sortReviews}', sort === 'reviews' ? ' selected' : '')
    .replace('{sortPopularity}', sort === 'popularity' ? ' selected' : '')
    .replace('{orderAsc}', order === 'asc' ? ' selected' : '')
    .replace('{orderDesc}', order === 'desc' ? ' selected' : '')
    .replace('{gamesList}', gamesList)
    .replace('{pagination}', totalPages > 1 ? pagination : '');
  
  res.send(html);
});

// API endpoint pour ajouter un jeu
app.post('/api/game/add', (req, res) => {
  try {
    const newGame = {
      appId: req.body.appId || String(Date.now()),
      title: req.body.title || 'Nouveau jeu',
      positive: parseInt(req.body.positive) || 0,
      negative: parseInt(req.body.negative) || 0,
      reviewsTotal: (parseInt(req.body.positive) || 0) + (parseInt(req.body.negative) || 0),
      price: parseFloat(req.body.price) || null,
      releaseDate: req.body.releaseDate || null,
      tags: req.body.tags ? req.body.tags.split(',').map(t => t.trim()) : [],
      genres: req.body.genres ? req.body.genres.split(',').map(g => g.trim()) : [],
      categories: [],
      description: req.body.description || '',
      headerImage: req.body.headerImage || '',
      developers: req.body.developers ? [req.body.developers] : [],
      publishers: req.body.publishers ? [req.body.publishers] : [],
      languages: [],
      metacriticScore: null,
      recommendations: null,
      estimatedOwners: null,
      averagePlaytime: 0
    };
    
    gamesDatabase.push(newGame);
    console.log(`✅ Jeu ajouté: "${newGame.title}" (ID: ${newGame.appId})`);
    
    res.json({ 
      success: true, 
      message: 'Jeu ajouté avec succès',
      game: newGame 
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout du jeu:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'ajout du jeu' 
    });
  }
});

// API endpoint pour supprimer un jeu
app.delete('/api/game/:id', (req, res) => {
  try {
    const gameId = req.params.id;
    const initialLength = gamesDatabase.length;
    gamesDatabase = gamesDatabase.filter(g => g.appId !== gameId);
    
    if (gamesDatabase.length < initialLength) {
      console.log(`Jeu supprimé (ID: ${gameId})`);
      res.json({ 
        success: true, 
        message: 'Jeu supprimé avec succès' 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        message: 'Jeu non trouvé' 
      });
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du jeu:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la suppression du jeu' 
    });
  }
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
  const totalReviews = gamesDatabase.reduce((sum, game) => sum + (game.reviewsTotal || 0), 0);
  
  let mostReviewed = { title: 'Aucun jeu trouvé', reviewsTotal: 0 };
  if (gamesDatabase.length > 0) {
    mostReviewed = gamesDatabase.reduce((prev, current) => 
      ((current.reviewsTotal || 0) > (prev.reviewsTotal || 0)) ? current : prev
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
      console.log(`Serveur démarré sur http://localhost:${PORT}`);
      console.log(`Base de données: ${gamesDatabase.length} jeux chargés`);
      console.log(`API disponible sur /api/search, /api/game/:id, /api/stats`);
    });
  } catch (error) {
    console.error('Erreur lors du démarrage:', error);
  }
}

startServer();