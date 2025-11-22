// Couche 3: API LAYER - Contrôleurs REST
const express = require('express');
const router = express.Router();

class GameController {
  constructor(gameService) {
    this.gameService = gameService;
  }

  /**
   * GET /api/games - Rechercher et filtrer les jeux
   */
  async searchGames(req, res) {
    try {
      const filters = {
        search: req.query.search || '',
        genre: req.query.genre || '',
        sort: req.query.sort || 'title',
        order: req.query.order || 'asc',
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await this.gameService.searchGames(filters);
      
      res.json({
        success: true,
        data: result.games,
        pagination: result.pagination,
        filters: filters
      });
    } catch (error) {
      console.error('Erreur dans searchGames:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche des jeux',
        error: error.message
      });
    }
  }

  /**
   * GET /api/games/:id - Obtenir un jeu par ID
   */
  async getGameById(req, res) {
    try {
      const game = await this.gameService.getGameById(req.params.id);
      
      if (game) {
        res.json({
          success: true,
          data: game
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Jeu non trouvé'
        });
      }
    } catch (error) {
      console.error('Erreur dans getGameById:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du jeu',
        error: error.message
      });
    }
  }

  /**
   * POST /api/games - Ajouter un nouveau jeu
   */
  async addGame(req, res) {
    try {
      const newGame = await this.gameService.addGame(req.body);
      console.log(`✅ Jeu ajouté: "${newGame.title}" (ID: ${newGame.appId})`);
      
      res.status(201).json({
        success: true,
        message: 'Jeu ajouté avec succès',
        data: newGame
      });
    } catch (error) {
      console.error('Erreur dans addGame:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de l\'ajout du jeu'
      });
    }
  }

  /**
   * PUT /api/games/:id - Mettre à jour un jeu
   */
  async updateGame(req, res) {
    try {
      const updatedGame = await this.gameService.updateGame(req.params.id, req.body);
      console.log(`✏️ Jeu mis à jour: "${updatedGame.title}" (ID: ${req.params.id})`);
      
      res.json({
        success: true,
        message: 'Jeu mis à jour avec succès',
        data: updatedGame
      });
    } catch (error) {
      console.error('Erreur dans updateGame:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du jeu'
      });
    }
  }

  /**
   * DELETE /api/games/:id - Supprimer un jeu
   */
  async deleteGame(req, res) {
    try {
      await this.gameService.deleteGame(req.params.id);
      console.log(`🗑️ Jeu supprimé (ID: ${req.params.id})`);
      
      res.json({
        success: true,
        message: 'Jeu supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur dans deleteGame:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Erreur lors de la suppression du jeu'
      });
    }
  }

  /**
   * GET /api/stats - Obtenir les statistiques
   */
  async getStatistics(req, res) {
    try {
      const stats = await this.gameService.getStatistics();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur dans getStatistics:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }

  /**
   * GET /api/genres - Obtenir tous les genres
   */
  async getGenres(req, res) {
    try {
      const genres = await this.gameService.getAllGenres();
      
      res.json({
        success: true,
        data: genres
      });
    } catch (error) {
      console.error('Erreur dans getGenres:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des genres',
        error: error.message
      });
    }
  }

  /**
   * Créer les routes
   */
  createRoutes() {
    router.get('/games', this.searchGames.bind(this));
    router.get('/games/:id', this.getGameById.bind(this));
    router.post('/games', this.addGame.bind(this));
    router.put('/games/:id', this.updateGame.bind(this));
    router.delete('/games/:id', this.deleteGame.bind(this));
    router.get('/stats', this.getStatistics.bind(this));
    router.get('/genres', this.getGenres.bind(this));
    
    return router;
  }
}

module.exports = GameController;
