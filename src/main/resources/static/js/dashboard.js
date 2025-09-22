// Dashboard-specific JavaScript functionality
class Dashboard {
    constructor() {
        this.baseUrl = '/api/data';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDashboardData();
    }

    bindEvents() {
        // Location filter
        const locationFilter = document.getElementById('locationFilter');
        if (locationFilter) {
            locationFilter.addEventListener('change', (e) => this.handleLocationFilter(e));
        }

        // Delete buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-btn')) {
                this.handleDeleteData(e);
            }
        });
    }

    async loadDashboardData() {
        try {
            const data = await ApiUtils.get(this.baseUrl);
            this.renderDataTable(data);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNoDataMessage();
        }
    }

    async handleLocationFilter(event) {
        const selectedLocation = event.target.value;
        
        try {
            let data;
            if (selectedLocation) {
                data = await ApiUtils.get(`${this.baseUrl}/location/${encodeURIComponent(selectedLocation)}`);
            } else {
                data = await ApiUtils.get(this.baseUrl);
            }
            
            this.renderDataTable(data);
        } catch (error) {
            console.error('Error filtering data:', error);
        }
    }

    async handleDeleteData(event) {
        event.preventDefault();
        
        const deleteBtn = event.target.closest('.delete-btn');
        const dataId = deleteBtn.dataset.id;
        
        if (!confirm('Are you sure you want to delete this record?')) {
            return;
        }

        try {
            const success = await ApiUtils.delete(`${this.baseUrl}/${dataId}`);
            
            if (success) {
                // Remove the row from the table
                const row = deleteBtn.closest('tr');
                row.remove();
                
                // Show success notification
                this.showNotification('success', 'Record deleted successfully!');
                
                // Check if table is empty
                this.checkEmptyTable();
            }
        } catch (error) {
            console.error('Error deleting data:', error);
            this.showNotification('error', 'Failed to delete record.');
        }
    }

    renderDataTable(data) {
        const tableBody = document.querySelector('.data-table tbody');
        const noDataMessage = document.getElementById('noDataMessage');
        
        if (!data || data.length === 0) {
            this.showNoDataMessage();
            return;
        }

        // Hide no data message
        if (noDataMessage) {
            noDataMessage.style.display = 'none';
        }

        // Clear existing rows
        tableBody.innerHTML = '';

        // Add new rows
        data.forEach(item => {
            const row = this.createTableRow(item);
            tableBody.appendChild(row);
        });
    }

    createTableRow(data) {
        const row = document.createElement('tr');
        
        const timestamp = new Date(data.timestamp).toLocaleString();
        
        row.innerHTML = `
            <td>${data.id}</td>
            <td><span class="location-badge">${data.location}</span></td>
            <td><span class="temperature">${data.temperature}°C</span></td>
            <td><span class="humidity">${data.humidity}%</span></td>
            <td>${data.description}</td>
            <td>${timestamp}</td>
            <td>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${data.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        return row;
    }

    showNoDataMessage() {
        const tableContainer = document.querySelector('.data-table-container');
        const noDataMessage = document.getElementById('noDataMessage');
        
        if (tableContainer) {
            tableContainer.style.display = 'none';
        }
        
        if (noDataMessage) {
            noDataMessage.style.display = 'block';
        }
    }

    checkEmptyTable() {
        const tableBody = document.querySelector('.data-table tbody');
        
        if (tableBody.children.length === 0) {
            this.showNoDataMessage();
        }
    }

    showNotification(type, message) {
        // Reuse the notification system from app.js
        if (window.LcadApp) {
            const app = new LcadApp();
            app.showNotification(type, message);
        } else {
            // Fallback notification
            alert(message);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.data-table')) {
        new Dashboard();
    }
});

// Add some dashboard-specific utilities
const DashboardUtils = {
    formatTemperature(temp) {
        return `${parseFloat(temp).toFixed(1)}°C`;
    },

    formatHumidity(humidity) {
        return `${humidity}%`;
    },

    formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    getTemperatureColor(temp) {
        const temperature = parseFloat(temp);
        if (temperature < 10) return '#2196F3'; // Cold - Blue
        if (temperature < 20) return '#4CAF50'; // Cool - Green
        if (temperature < 30) return '#FF9800'; // Warm - Orange
        return '#F44336'; // Hot - Red
    },

    getHumidityColor(humidity) {
        const humidityValue = parseInt(humidity);
        if (humidityValue < 30) return '#FF5722'; // Low - Red
        if (humidityValue < 60) return '#4CAF50'; // Normal - Green
        return '#2196F3'; // High - Blue
    }
};

// Enhanced table rendering with colors
if (typeof Dashboard !== 'undefined') {
    Dashboard.prototype.createTableRowEnhanced = function(data) {
        const row = document.createElement('tr');
        
        const timestamp = DashboardUtils.formatTimestamp(data.timestamp);
        const tempColor = DashboardUtils.getTemperatureColor(data.temperature);
        const humidityColor = DashboardUtils.getHumidityColor(data.humidity);
        
        row.innerHTML = `
            <td>${data.id}</td>
            <td><span class="location-badge">${data.location}</span></td>
            <td><span class="temperature" style="color: ${tempColor}">${DashboardUtils.formatTemperature(data.temperature)}</span></td>
            <td><span class="humidity" style="color: ${humidityColor}">${DashboardUtils.formatHumidity(data.humidity)}</span></td>
            <td>${data.description}</td>
            <td>${timestamp}</td>
            <td>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${data.id}" title="Delete record">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        return row;
    };
}