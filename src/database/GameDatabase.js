const { MongoClient } = require('mongodb');
const config = require('./config');

class GameDatabase {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      console.log('Connexion à MongoDB...');
      this.client = new MongoClient(config.mongoUrl, config.options);
      await this.client.connect();
      
      this.db = this.client.db(config.dbName);
      this.collection = this.db.collection(config.collectionName);
      this.isConnected = true;
      
      console.log(`Connecté à MongoDB: ${config.dbName}`);
      
      await this.createIndexes();
      
      return true;
    } catch (error) {
      console.error('Erreur de connexion MongoDB:', error);
      throw error;
    }
  }

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

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('Déconnecté de MongoDB');
    }
  }

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
    
    if (filters.price) {
      query.price = filters.price;
    }
    
    if (filters.releaseDate) {
      query.releaseDate = filters.releaseDate;
    }
    
    if (filters.score) {
      const conditions = [];
      
      if (filters.score.$gte !== undefined) {
        conditions.push({
          $expr: {
            $gte: [
              {
                $cond: {
                  if: { $eq: [{ $add: ['$positive', '$negative'] }, 0] },
                  then: 0,
                  else: {
                    $multiply: [
                      { $divide: ['$positive', { $add: ['$positive', '$negative'] }] },
                      100
                    ]
                  }
                }
              },
              filters.score.$gte
            ]
          }
        });
      }
      
      if (filters.score.$lte !== undefined) {
        conditions.push({
          $expr: {
            $lte: [
              {
                $cond: {
                  if: { $eq: [{ $add: ['$positive', '$negative'] }, 0] },
                  then: 0,
                  else: {
                    $multiply: [
                      { $divide: ['$positive', { $add: ['$positive', '$negative'] }] },
                      100
                    ]
                  }
                }
              },
              filters.score.$lte
            ]
          }
        });
      }
      
      if (conditions.length > 0) {
        query.$and = query.$and || [];
        query.$and.push(...conditions);
      }
    }
    
    return query;
  }

  async countGames(filters = {}) {
    const query = this.buildQuery(filters);
    return await this.collection.countDocuments(query);
  }

  async getGameById(appId) {
    return await this.collection.findOne({ appId: appId });
  }

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

  async deleteGame(appId) {
    const result = await this.collection.deleteOne({ appId: appId });
    return result.deletedCount > 0;
  }

  async updateGame(appId, updateData) {
    const result = await this.collection.updateOne(
      { appId: appId },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  }

  async getAllGenres(excludedGenres = []) {
    const genres = await this.collection.distinct('genres');
    return genres
      .filter(g => g && !excludedGenres.includes(g.toLowerCase()))
      .sort();
  }

  async getTotalGames() {
    return await this.collection.countDocuments();
  }

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
