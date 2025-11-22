// Configuration MongoDB
module.exports = {
  // URL de connexion MongoDB
  // Par défaut: MongoDB local sur le port 27017
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017',
  
  // Nom de la base de données
  dbName: process.env.DB_NAME || 'steam_games_db',
  
  // Nom de la collection
  collectionName: 'games',
  
  // Options de connexion
  options: {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }
};
