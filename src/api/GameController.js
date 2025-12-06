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
        limit: parseInt(req.query.limit) || 20,
        priceMin: req.query.priceMin ? parseFloat(req.query.priceMin) : undefined,
        priceMax: req.query.priceMax ? parseFloat(req.query.priceMax) : undefined,
        dateMin: req.query.dateMin || undefined,
        dateMax: req.query.dateMax || undefined,
        scoreMin: req.query.scoreMin ? parseFloat(req.query.scoreMin) : undefined,
        scoreMax: req.query.scoreMax ? parseFloat(req.query.scoreMax) : undefined
      };

      const result = await this.gameService.searchGames(filters);
      
      res.json({
        success: true,
        data: result.games,
        pagination: result.pagination,
        filters: filters
      });
    } catch (error) {
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
      
      res.status(201).json({
        success: true,
        message: 'Jeu ajouté avec succès',
        data: newGame
      });
    } catch (error) {
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
      
      res.json({
        success: true,
        message: 'Jeu mis à jour avec succès',
        data: updatedGame
      });
    } catch (error) {
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
      
      res.json({
        success: true,
        message: 'Jeu supprimé avec succès'
      });
    } catch (error) {
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
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des genres',
        error: error.message
      });
    }
  }

  /**
   * GET /api/export/csv - Exporter les jeux en CSV
   */
  async exportCSV(req, res) {
    try {
      const { limit = 1000 } = req.query;
      const csvData = await this.gameService.exportToCSV(parseInt(limit));
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="games_export_${Date.now()}.csv"`);
      res.send(csvData);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export CSV',
        error: error.message
      });
    }
  }

  /**
   * POST /api/import/csv - Importer des jeux depuis CSV
   */
  async importCSV(req, res) {
    try {
      const { csvData } = req.body;
      
      if (!csvData) {
        return res.status(400).json({
          success: false,
          message: 'Aucune donnée CSV fournie'
        });
      }

      const result = await this.gameService.importFromCSV(csvData);
      
      res.json({
        success: true,
        message: `Import terminé: ${result.imported} jeux ajoutés`,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'import CSV',
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
    router.get('/export/csv', this.exportCSV.bind(this));
    router.post('/import/csv', this.importCSV.bind(this));
    
    return router;
  }
}

module.exports = GameController;
