-- Database schema for storing API scraped data
-- This example uses a simple structure for storing weather data from a public API

DROP TABLE IF EXISTS api_data;

CREATE TABLE api_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    temperature DECIMAL(5,2),
    humidity INTEGER,
    description VARCHAR(500),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data
INSERT INTO api_data (location, temperature, humidity, description) VALUES
('Paris', 22.5, 65, 'Clear sky'),
('London', 18.3, 72, 'Partly cloudy'),
('New York', 25.1, 58, 'Sunny'),
('Tokyo', 20.8, 80, 'Light rain');