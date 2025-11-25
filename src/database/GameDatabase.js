// Couche 1: DATA LAYER - Gestion de la base de données MongoDB
const { MongoClient } = require('mongodb');
const config = require('./config');

class GameDatabase {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
    this.isConnected = false;
  }

  /**
   * Connecter à MongoDB
   */
  async connect() {
    try {
      console.log('Connexion à MongoDB...');
      this.client = new MongoClient(config.mongoUrl, config.options);
      await this.client.connect();
      
      this.db = this.client.db(config.dbName);
      this.collection = this.db.collection(config.collectionName);
      this.isConnected = true;
      
      console.log(`Connecté à MongoDB: ${config.dbName}`);
      
      // Créer des index pour améliorer les performances
      await this.createIndexes();
      
      return true;
    } catch (error) {
      console.error('Erreur de connexion MongoDB:', error);
      throw error;
    }
  }

  /**
   * Créer des index sur la collection
   */
  async createIndexes() {
    try {
      await this.collection.createIndex({ appId: 1 }, { unique: true });
      await this.collection.createIndex({ title: 'text', tags: 'text' });
      await this.collection.createIndex({ genres: 1 });
      await this.collection.createIndex({ reviewsTotal: -1 });
      console.log('Index créés sur la collection');
    } catch (error) {
      console.warn('Erreur lors de la création des index:', error.message);
    }
  }

  /**
   * Déconnecter de MongoDB
   */
  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('Déconnecté de MongoDB');
    }
  }

  /**
   * Obtenir tous les jeux avec filtres
   */
  async getAllGames(filters = {}, options = {}) {
    const query = this.buildQuery(filters);
    const { skip = 0, limit = 0, sort = {} } = options;
    
    return await this.collection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  /**
   * Construire une requête MongoDB depuis des filtres
   */
  buildQuery(filters) {
    const query = {};
    
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { tags: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    if (filters.genre) {
      query.genres = filters.genre;
    }
    
    return query;
  }

  /**
   * Compter le nombre de jeux
   */
  async countGames(filters = {}) {
    const query = this.buildQuery(filters);
    return await this.collection.countDocuments(query);
  }

  /**
   * Obtenir un jeu par ID
   */
  async getGameById(appId) {
    return await this.collection.findOne({ appId: appId });
  }

  /**
   * Ajouter un jeu
   */
  async addGame(gameData) {
    const newGame = {
      appId: gameData.appId || String(Date.now()),
      title: gameData.title || 'Nouveau jeu',
      positive: parseInt(gameData.positive) || 0,
      negative: parseInt(gameData.negative) || 0,
      reviewsTotal: (parseInt(gameData.positive) || 0) + (parseInt(gameData.negative) || 0),
      price: parseFloat(gameData.price) || null,
      releaseDate: gameData.releaseDate || null,
      tags: gameData.tags || [],
      genres: gameData.genres || [],
      categories: gameData.categories || [],
      description: gameData.description || '',
      headerImage: gameData.headerImage || '',
      developers: gameData.developers || [],
      publishers: gameData.publishers || [],
      languages: gameData.languages || [],
      metacriticScore: gameData.metacriticScore || null,
      recommendations: gameData.recommendations || null,
      estimatedOwners: gameData.estimatedOwners || null,
      averagePlaytime: gameData.averagePlaytime || 0,
      createdAt: new Date()
    };
    
    const result = await this.collection.insertOne(newGame);
    return { ...newGame, _id: result.insertedId };
  }

  /**
   * Supprimer un jeu
   */
  async deleteGame(appId) {
    const result = await this.collection.deleteOne({ appId: appId });
    return result.deletedCount > 0;
  }

  /**
   * Mettre à jour un jeu
   */
  async updateGame(appId, updateData) {
    const result = await this.collection.updateOne(
      { appId: appId },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  /**
   * Obtenir tous les genres uniques
   */
  async getAllGenres(excludedGenres = []) {
    const genres = await this.collection.distinct('genres');
    return genres
      .filter(g => g && !excludedGenres.includes(g.toLowerCase()))
      .sort();
  }

  /**
   * Obtenir le nombre total de jeux
   */
  async getTotalGames() {
    return await this.collection.countDocuments();
  }

  /**
   * Obtenir les statistiques
   */
  async getStatistics() {
    const pipeline = [
      {
        $group: {
          _id: null,
          totalGames: { $sum: 1 },
          totalReviews: { $sum: '$reviewsTotal' },
          avgPrice: { $avg: '$price' }
        }
      }
    ];
    
    const stats = await this.collection.aggregate(pipeline).toArray();
    return stats[0] || { totalGames: 0, totalReviews: 0, avgPrice: 0 };
  }

  /**
   * Obtenir le jeu le plus populaire
   */
  async getMostPopularGame() {
    return await this.collection
      .find()
      .sort({ reviewsTotal: -1 })
      .limit(1)
      .toArray()
      .then(games => games[0] || null);
  }
}

module.exports = GameDatabase;
