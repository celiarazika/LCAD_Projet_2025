// Main application JavaScript
class LcadApp {
    constructor() {
        this.baseUrl = '/api/data';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInitialData();
    }

    bindEvents() {
        // Scrape data button
        const scrapeBtn = document.getElementById('scrapeBtn');
        if (scrapeBtn) {
            scrapeBtn.addEventListener('click', (e) => this.handleScrapeData(e));
        }

        // Refresh data button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => this.handleRefreshData(e));
        }

        // Dashboard refresh button
        const refreshDataBtn = document.getElementById('refreshDataBtn');
        if (refreshDataBtn) {
            refreshDataBtn.addEventListener('click', (e) => this.handleRefreshData(e));
        }
    }

    async loadInitialData() {
        try {
            await this.updateLocationsList();
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    async handleScrapeData(event) {
        event.preventDefault();
        const button = event.target.closest('button');
        
        try {
            this.setButtonLoading(button, true);
            
            const response = await fetch(`${this.baseUrl}/scrape`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const message = await response.text();
                this.showNotification('success', 'Data scraped successfully!');
                console.log(message);
                
                // Refresh the page data
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                throw new Error('Failed to scrape data');
            }
        } catch (error) {
            console.error('Error scraping data:', error);
            this.showNotification('error', 'Failed to scrape data. Please try again.');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    async handleRefreshData(event) {
        event.preventDefault();
        const button = event.target.closest('button');
        
        try {
            this.setButtonLoading(button, true);
            await this.updateLocationsList();
            this.showNotification('success', 'Data refreshed successfully!');
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showNotification('error', 'Failed to refresh data.');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    async updateLocationsList() {
        try {
            const response = await fetch(`${this.baseUrl}/locations`);
            if (response.ok) {
                const locations = await response.json();
                this.renderLocationsList(locations);
            }
        } catch (error) {
            console.error('Error updating locations:', error);
        }
    }

    renderLocationsList(locations) {
        const locationsList = document.getElementById('locationsList');
        if (locationsList) {
            locationsList.innerHTML = '';
            locations.forEach(location => {
                const badge = document.createElement('span');
                badge.className = 'location-badge';
                badge.textContent = location;
                locationsList.appendChild(badge);
            });
        }
    }

    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.classList.add('loading');
            const originalContent = button.innerHTML;
            button.dataset.originalContent = originalContent;
            button.innerHTML = '<span class="spinner"></span> Processing...';
        } else {
            button.disabled = false;
            button.classList.remove('loading');
            button.innerHTML = button.dataset.originalContent || button.innerHTML;
        }
    }

    showNotification(type, message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        // Add notification styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
                    animation: slideIn 0.3s ease-out;
                }
                
                .notification-success {
                    background: #28a745;
                }
                
                .notification-error {
                    background: #dc3545;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        // Add to DOM
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LcadApp();
});

// Utility functions for API calls
const ApiUtils = {
    async get(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    },

    async post(url, data) {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    },

    async delete(url) {
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.ok;
    }
};