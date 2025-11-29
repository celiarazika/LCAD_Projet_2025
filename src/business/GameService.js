// Couche 2: BUSINESS LOGIC LAYER - Logique métier pour les jeux
const GameDatabase = require('../database/GameDatabase');

class GameService {
  constructor(database) {
    this.db = database;
  }

  /**
   * Rechercher et filtrer les jeux
   */
  async searchGames(filters = {}) {
    const { 
      search = '', 
      genre = '', 
      page = 1, 
      limit = 20, 
      sort = 'title', 
      order = 'asc',
      priceMin,
      priceMax,
      dateMin,
      dateMax,
      scoreMin,
      scoreMax
    } = filters;
    
    // Construction des filtres pour MongoDB
    const dbFilters = {};
    if (search) dbFilters.search = search;
    if (genre) dbFilters.genre = genre;
    
    // Filtres de prix
    if (priceMin !== undefined || priceMax !== undefined) {
      dbFilters.price = {};
      if (priceMin !== undefined) dbFilters.price.$gte = parseFloat(priceMin);
      if (priceMax !== undefined) dbFilters.price.$lte = parseFloat(priceMax);
    }
    
    // Filtres de date
    if (dateMin || dateMax) {
      dbFilters.releaseDate = {};
      if (dateMin) dbFilters.releaseDate.$gte = dateMin;
      if (dateMax) dbFilters.releaseDate.$lte = dateMax;
    }
    
    // Filtres de score (pourcentage positif)
    if (scoreMin !== undefined || scoreMax !== undefined) {
      dbFilters.score = {};
      if (scoreMin !== undefined) dbFilters.score.$gte = parseFloat(scoreMin);
      if (scoreMax !== undefined) dbFilters.score.$lte = parseFloat(scoreMax);
    }
    
    // Construction des options de tri MongoDB
    const sortOptions = this.buildSortOptions(sort, order);
    
    // Construction des options de pagination
    const skip = (page - 1) * limit;
    const dbOptions = {
      skip,
      limit,
      sort: sortOptions
    };
    
    // Récupérer les jeux depuis MongoDB
    const games = await this.db.getAllGames(dbFilters, dbOptions);
    const totalGames = await this.db.countGames(dbFilters);
    const totalPages = Math.ceil(totalGames / limit);

    return {
      games,
      pagination: {
        currentPage: page,
        totalPages,
        totalGames,
        limit
      }
    };
  }

  /**
   * Construire les options de tri pour MongoDB
   */
  buildSortOptions(sort, order) {
    const direction = order === 'asc' ? 1 : -1;
    
    switch(sort) {
      case 'title':
        return { title: direction };
      case 'score':
        // Pour le score, on doit calculer le pourcentage positif
        // Pour simplifier, on trie par nombre d'avis positifs
        return { positive: direction };
      case 'price':
        return { price: direction };
      case 'date':
        return { releaseDate: direction };
      case 'reviews':
      case 'popularity':
        return { reviewsTotal: direction };
      default:
        return { title: direction };
    }
  }

  /**
   * Obtenir un jeu par ID
   */
  async getGameById(appId) {
    return await this.db.getGameById(appId);
  }

  /**
   * Ajouter un nouveau jeu
   */
  async addGame(gameData) {
    // Validation
    if (!gameData.title || gameData.title.trim() === '') {
      throw new Error('Le titre du jeu est requis');
    }

    // Parsing des données
    const processedData = {
      ...gameData,
      tags: typeof gameData.tags === 'string' 
        ? gameData.tags.split(',').map(t => t.trim()).filter(t => t !== '')
        : gameData.tags,
      genres: typeof gameData.genres === 'string'
        ? gameData.genres.split(',').map(g => g.trim()).filter(g => g !== '')
        : gameData.genres,
      developers: gameData.developers ? [gameData.developers] : [],
      publishers: gameData.publishers ? [gameData.publishers] : []
    };

    return await this.db.addGame(processedData);
  }

  /**
   * Mettre à jour un jeu
   */
  async updateGame(appId, gameData) {
    // Vérifier que le jeu existe
    const existingGame = await this.db.getGameById(appId);
    if (!existingGame) {
      throw new Error('Jeu non trouvé');
    }

    // Validation du titre si fourni
    if (gameData.title !== undefined && (!gameData.title || gameData.title.trim() === '')) {
      throw new Error('Le titre du jeu ne peut pas être vide');
    }

    // Parsing des données
    const processedData = {};
    
    // Ne mettre à jour que les champs fournis
    if (gameData.title !== undefined) processedData.title = gameData.title;
    if (gameData.positive !== undefined) processedData.positive = parseInt(gameData.positive) || 0;
    if (gameData.negative !== undefined) processedData.negative = parseInt(gameData.negative) || 0;
    if (gameData.price !== undefined) processedData.price = parseFloat(gameData.price) || null;
    if (gameData.releaseDate !== undefined) processedData.releaseDate = gameData.releaseDate;
    if (gameData.description !== undefined) processedData.description = gameData.description;
    if (gameData.headerImage !== undefined) processedData.headerImage = gameData.headerImage;
    
    // Recalculer le total des avis si nécessaire
    if (gameData.positive !== undefined || gameData.negative !== undefined) {
      const positive = gameData.positive !== undefined ? parseInt(gameData.positive) || 0 : existingGame.positive || 0;
      const negative = gameData.negative !== undefined ? parseInt(gameData.negative) || 0 : existingGame.negative || 0;
      processedData.reviewsTotal = positive + negative;
    }
    
    // Traiter les tableaux
    if (gameData.tags !== undefined) {
      processedData.tags = typeof gameData.tags === 'string'
        ? gameData.tags.split(',').map(t => t.trim()).filter(t => t !== '')
        : gameData.tags;
    }
    
    if (gameData.genres !== undefined) {
      processedData.genres = typeof gameData.genres === 'string'
        ? gameData.genres.split(',').map(g => g.trim()).filter(g => g !== '')
        : gameData.genres;
    }
    
    if (gameData.developers !== undefined) {
      processedData.developers = Array.isArray(gameData.developers)
        ? gameData.developers
        : [gameData.developers];
    }
    
    if (gameData.publishers !== undefined) {
      processedData.publishers = Array.isArray(gameData.publishers)
        ? gameData.publishers
        : [gameData.publishers];
    }

    const updated = await this.db.updateGame(appId, processedData);
    if (!updated) {
      throw new Error('Erreur lors de la mise à jour');
    }
    
    // Retourner le jeu mis à jour
    return await this.db.getGameById(appId);
  }

  /**
   * Supprimer un jeu
   */
  async deleteGame(appId) {
    const deleted = await this.db.deleteGame(appId);
    if (!deleted) {
      throw new Error('Jeu non trouvé');
    }
    return true;
  }

  /**
   * Obtenir les statistiques
   */
  async getStatistics() {
    const stats = await this.db.getStatistics();
    const mostPopular = await this.db.getMostPopularGame();
    
    return {
      totalGames: stats.totalGames,
      totalReviews: stats.totalReviews,
      averagePrice: stats.avgPrice ? stats.avgPrice.toFixed(2) : '0.00',
      mostReviewed: mostPopular ? {
        title: mostPopular.title,
        reviews: mostPopular.reviewsTotal
      } : {
        title: 'Aucun jeu trouvé',
        reviews: 0
      }
    };
  }

  /**
   * Obtenir tous les genres
   */
  async getAllGenres() {
    const excludedGenres = ['nudity', 'sexual content'];
    return await this.db.getAllGenres(excludedGenres);
  }

  /**
   * Exporter les jeux en CSV
   */
  async exportToCSV(limit = 1000) {
    const games = await this.db.getAllGames({}, { limit });
    
    // En-têtes CSV
    const headers = 'appId,title,positive,negative,reviewsTotal,price,releaseDate,genres,tags,developers,publishers,description\n';
    
    // Convertir les jeux en lignes CSV
    const rows = games.map(game => {
      return [
        game.appId || '',
        `"${(game.title || '').replace(/"/g, '""')}"`,
        game.positive || 0,
        game.negative || 0,
        game.reviewsTotal || 0,
        game.price || '',
        game.releaseDate || '',
        `"${Array.isArray(game.genres) ? game.genres.join(';') : ''}"`,
        `"${Array.isArray(game.tags) ? game.tags.join(';') : ''}"`,
        `"${Array.isArray(game.developers) ? game.developers.join(';') : ''}"`,
        `"${Array.isArray(game.publishers) ? game.publishers.join(';') : ''}"`,
        `"${(game.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ].join(',');
    }).join('\n');
    
    return headers + rows;
  }

  /**
   * Importer des jeux depuis CSV
   */
  async importFromCSV(csvData) {
    const lines = csvData.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('Fichier CSV vide ou invalide');
    }
    
    // Ignorer la ligne d'en-tête
    const dataLines = lines.slice(1);
    
    let imported = 0;
    let errors = 0;
    const errorDetails = [];
    
    for (const line of dataLines) {
      try {
        // Parse CSV simple (gère les guillemets)
        const values = this.parseCSVLine(line);
        
        if (values.length < 2) continue; // Ligne vide ou invalide
        
        const gameData = {
          appId: values[0] || String(Date.now() + Math.random()),
          title: values[1] || 'Sans titre',
          positive: parseInt(values[2]) || 0,
          negative: parseInt(values[3]) || 0,
          price: parseFloat(values[5]) || null,
          releaseDate: values[6] || null,
          genres: values[7] ? values[7].split(';').filter(g => g) : [],
          tags: values[8] ? values[8].split(';').filter(t => t) : [],
          developers: values[9] ? values[9].split(';').filter(d => d) : [],
          publishers: values[10] ? values[10].split(';').filter(p => p) : [],
          description: values[11] || ''
        };
        
        await this.addGame(gameData);
        imported++;
      } catch (error) {
        errors++;
        errorDetails.push({ line: line.substring(0, 50), error: error.message });
      }
    }
    
    return {
      imported,
      errors,
      total: dataLines.length,
      errorDetails: errorDetails.slice(0, 10) // Limiter à 10 erreurs
    };
  }

  /**
   * Parser une ligne CSV (gère les guillemets)
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }
}

module.exports = GameService;
