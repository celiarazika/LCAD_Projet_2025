// Frontend JavaScript - Communication avec l'API
const API_URL = '/api';

let currentPage = 1;
let currentFilters = {
    search: '',
    genre: '',
    sort: 'popularity',
    order: 'desc',
    priceMin: '',
    priceMax: '',
    scoreMin: '',
    scoreMax: '',
    dateMin: '',
    dateMax: ''
};

document.addEventListener('DOMContentLoaded', function() {
    loadStatistics();
    loadGenres();
    loadGames();
    document.getElementById('search-form').addEventListener('submit', handleSearch);
    document.getElementById('add-game-form').addEventListener('submit', handleAddGame);
    document.getElementById('update-game-form').addEventListener('submit', handleUpdateGame);
    document.getElementById('genre').addEventListener('change', handleSearch);
    document.getElementById('sort').addEventListener('change', handleSearch);
    document.getElementById('order').addEventListener('change', handleSearch);
    document.getElementById('priceMin').addEventListener('change', handleSearch);
    document.getElementById('priceMax').addEventListener('change', handleSearch);
    document.getElementById('scoreMin').addEventListener('change', handleSearch);
    document.getElementById('scoreMax').addEventListener('change', handleSearch);
    document.getElementById('dateMin').addEventListener('change', handleSearch);
    document.getElementById('dateMax').addEventListener('change', handleSearch);
});

async function loadStatistics() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('totalGames').textContent = result.data.totalGames.toLocaleString();
            document.getElementById('mostPopular').textContent = result.data.mostReviewed.title;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

async function loadGenres() {
    try {
        const response = await fetch(`${API_URL}/genres`);
        const result = await response.json();
        
        if (result.success) {
            const genreSelect = document.getElementById('genre');
            result.data.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre;
                option.textContent = genre;
                genreSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erreur lors du chargement des genres:', error);
    }
}

async function loadGames(page = 1) {
    currentPage = page;
    
    const params = new URLSearchParams({
        ...currentFilters,
        page: page,
        limit: 20
    });
    
    try {
        const response = await fetch(`${API_URL}/games?${params}`);
        const result = await response.json();
        
        if (result.success) {
            displayGames(result.data);
            displayPagination(result.pagination);
        } else {
            document.getElementById('games-list').innerHTML = '<p>Erreur lors du chargement des jeux</p>';
        }
    } catch (error) {
        console.error('Erreur lors du chargement des jeux:', error);
        document.getElementById('games-list').innerHTML = '<p>Erreur de connexion à l\'API</p>';
    }
}

// Afficher les jeux
function displayGames(games) {
    const gamesList = document.getElementById('games-list');
    
    if (games.length === 0) {
        gamesList.innerHTML = '<p>Aucun jeu trouvé</p>';
        return;
    }
    
    gamesList.innerHTML = games.map(game => {
        const positivePercentage = game.reviewsTotal > 0 
            ? Math.round((game.positive / game.reviewsTotal) * 100) 
            : 0;
        
        const imageUrl = game.appId 
            ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appId}/header.jpg`
            : '';
        
        const genres = game.genres && game.genres.length > 0 
            ? game.genres.slice(0, 3).join(', ') 
            : 'Non spécifiés';
        
        const tags = game.tags && game.tags.length > 0
            ? game.tags.slice(0, 10).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')
            : '';
        
        return `
            <div class="game-card">
                <img src="${imageUrl}" alt="${escapeHtml(game.title)}" class="game-image" 
                     onerror="this.style.display='none'">
                <div class="game-content">
                    <div class="game-title">${escapeHtml(game.title)}</div>
                    <div class="game-info"><strong>Date de sortie:</strong> ${game.releaseDate || 'Date inconnue'}</div>
                    <div class="game-info"><strong>Score:</strong> ${positivePercentage}% positif (${game.reviewsTotal.toLocaleString()} avis)</div>
                    <div class="game-info"><strong>Prix:</strong> ${game.price ? game.price + '$' : 'Prix non disponible'}</div>
                    <div class="game-info"><strong>Genres:</strong> ${genres}</div>
                    <div class="tags">${tags}</div>
                    <div class="game-info"><a href="https://steamcommunity.com/app/${game.appId}" target="_blank" style="color: #66c0f4;">Voir sur Steam</a></div>
                    <div class="game-actions">
                        <button class="edit-btn" onclick="openUpdateModal('${game.appId}')">Modifier</button>
                        <button class="delete-btn" onclick="deleteGame('${game.appId}')">Supprimer</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// pagination
function displayPagination(pagination) {
    const paginationDiv = document.getElementById('pagination');
    
    if (pagination.totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }
    
    let html = '';
    
    if (pagination.currentPage > 1) {
        html += `<button onclick="loadGames(${pagination.currentPage - 1})">« Précédent</button>`;
    }
    
    for (let i = Math.max(1, pagination.currentPage - 2); i <= Math.min(pagination.totalPages, pagination.currentPage + 2); i++) {
        if (i === pagination.currentPage) {
            html += `<button class="current">${i}</button>`;
        } else {
            html += `<button onclick="loadGames(${i})">${i}</button>`;
        }
    }
    
    if (pagination.currentPage < pagination.totalPages) {
        html += `<button onclick="loadGames(${pagination.currentPage + 1})">Suivant »</button>`;
    }
    
    paginationDiv.innerHTML = html;
}

// recherche
function handleSearch(event) {
    event.preventDefault();
    
    currentFilters = {
        search: document.getElementById('search').value,
        genre: document.getElementById('genre').value,
        sort: document.getElementById('sort').value,
        order: document.getElementById('order').value,
        priceMin: document.getElementById('priceMin').value,
        priceMax: document.getElementById('priceMax').value,
        scoreMin: document.getElementById('scoreMin').value,
        scoreMax: document.getElementById('scoreMax').value,
        dateMin: document.getElementById('dateMin').value,
        dateMax: document.getElementById('dateMax').value
    };
    
    console.log('Nouveaux filtres:', currentFilters);
    loadGames(1);
}

// Pour réinitialiser les filtres
function resetFilters() {
    document.getElementById('search').value = '';
    document.getElementById('genre').value = '';
    document.getElementById('sort').value = 'popularity';
    document.getElementById('order').value = 'desc';
    document.getElementById('priceMin').value = '';
    document.getElementById('priceMax').value = '';
    document.getElementById('scoreMin').value = '';
    document.getElementById('scoreMax').value = '';
    document.getElementById('dateMin').value = '';
    document.getElementById('dateMax').value = '';
    
    currentFilters = {
        search: '',
        genre: '',
        sort: 'popularity',
        order: 'desc'
    };
    
    loadGames(1);
}

// Ajouter un jeu
async function handleAddGame(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    console.log('Ajout d\'un jeu:', data);
    
    try {
        const response = await fetch(`${API_URL}/games`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Jeu ajouté avec succès!');
            event.target.reset();
            loadGames(currentPage);
            loadStatistics();
        } else {
            alert('Erreur: ' + result.message);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'ajout du jeu');
    }
}

// Supprimer un jeu
async function deleteGame(appId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce jeu?')) {
        return;
    }
    
    console.log('Suppression du jeu:', appId);
    
    try{
        const response = await fetch(`${API_URL}/games/${appId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Jeu supprimé avec succès!');
            loadGames(currentPage);
            loadStatistics();
        } else {
            alert('Erreur: ' + result.message);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la suppression');
    }
}

//modal de mise à jour
async function openUpdateModal(appId) {
    console.log('Ouverture du modal pour le jeu:', appId);
    
    try {
        // détails du jeu
        const response = await fetch(`${API_URL}/games/${appId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            const game = result.data;
            
            // formulaire
            document.getElementById('update-appId').value = game.appId;
            document.getElementById('update-title').value = game.title || '';
            document.getElementById('update-positive').value = game.positive || 0;
            document.getElementById('update-negative').value = game.negative || 0;
            document.getElementById('update-price').value = game.price || '';
            document.getElementById('update-releaseDate').value = game.releaseDate || '';
            document.getElementById('update-genres').value = Array.isArray(game.genres) ? game.genres.join(', ') : '';
            document.getElementById('update-tags').value = Array.isArray(game.tags) ? game.tags.join(', ') : '';
            document.getElementById('update-developers').value = Array.isArray(game.developers) ? game.developers[0] || '' : game.developers || '';
            document.getElementById('update-publishers').value = Array.isArray(game.publishers) ? game.publishers[0] || '' : game.publishers || '';
            document.getElementById('update-description').value = game.description || '';
            
            // afficher le modal
            document.getElementById('update-modal').style.display = 'block';
        } else {
            alert('Impossible de charger les données du jeu');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement du jeu');
    }
}

//fermer modal maj
function closeUpdateModal() {
    document.getElementById('update-modal').style.display = 'none';
    document.getElementById('update-game-form').reset();
}

async function handleUpdateGame(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const appId = formData.get('appId');
    const data = Object.fromEntries(formData);
    delete data.appId; // Ne pas envoyer l'appId dans le body
    
    console.log('Mise à jour du jeu:', appId, data);
    
    try {
        const response = await fetch(`${API_URL}/games/${appId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Jeu mis à jour avec succès!');
            closeUpdateModal();
            loadGames(currentPage);
            loadStatistics();
        } else {
            alert('Erreur: ' + result.message);
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la mise à jour du jeu');
    }
}


function toggleAdmin() {
    const adminSection = document.getElementById('admin-section');
    adminSection.style.display = adminSection.style.display === 'none' ? 'block' : 'none';
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}

// Export CSV
async function exportToCSV() {
    const limit = document.getElementById('export-limit').value || 1000;
    
    console.log(`Export de ${limit} jeux en CSV...`);
    
    try {
        const response = await fetch(`${API_URL}/export/csv?limit=${limit}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `games_export_${Date.now()}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            alert(`${limit} jeux exportés avec succès!`);
        } else {
            alert('Erreur lors de l\'export CSV');
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de l\'export CSV');
    }
}

// Import CSV
async function importFromCSV() {
    const fileInput = document.getElementById('csv-file-input');
    const statusDiv = document.getElementById('import-status');
    
    if (!fileInput.files || fileInput.files.length === 0) {
        alert('Veuillez sélectionner un fichier CSV');
        return;
    }
    
    const file = fileInput.files[0];
    
    console.log(`Import du fichier: ${file.name}`);
    statusDiv.innerHTML = '<p style="color: #66c0f4;">Import en cours...</p>';
    
    try {
        const csvData = await file.text();
        
        const response = await fetch(`${API_URL}/import/csv`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ csvData })
        });
        
        const result = await response.json();
        
        if (result.success) {
            statusDiv.innerHTML = `
                <p style="color: #4caf50;">${result.message}</p>
                <p style="font-size: 12px;">
                    Importés: ${result.data.imported} | 
                    Erreurs: ${result.data.errors} | 
                    Total: ${result.data.total}
                </p>
            `;
            loadGames(currentPage);
            loadStatistics();
            fileInput.value = '';
        } else {
            statusDiv.innerHTML = `<p style="color: #f44336;">${result.message}</p>`;
        }
    } catch (error) {
        console.error('Erreur:', error);
        statusDiv.innerHTML = `<p style="color: #f44336;">Erreur lors de l'import</p>`;
    }
}

//affichage des filtres avancés
function toggleAdvancedFilters() {
    const content = document.getElementById('advanced-filters-content');
    const isVisible = content.style.display !== 'none';
    content.style.display = isVisible ? 'none' : 'block';
    const header = document.querySelector('.advanced-filters h4');
    header.textContent = isVisible ? '▼ Filtres avancés' : '▲ Filtres avancés';
}
