# LCAD Projet 2025 - 3-Tier Architecture Implementation

This project demonstrates a complete **3-tier architecture** implementation using modern technologies:

## 🏗️ Architecture Overview

### 📊 **Data Layer (Tier 1)**
- **Technology**: SQL Database with H2 in-memory storage
- **Features**:
  - Database schema for storing scraped API data
  - Sample data initialization
  - H2 console for database management
  - JPA/Hibernate for ORM

### ⚙️ **Application Layer (Tier 2)** 
- **Technology**: Java with Spring Boot
- **Features**:
  - REST API endpoints for data operations
  - API scraping service for external data integration
  - Spring Data JPA for database operations
  - Business logic and data processing
  - Automatic data generation (mock API scraping)

### 🎨 **Presentation Layer (Tier 3)**
- **Technology**: HTML5, CSS3, and JavaScript
- **Features**:
  - Responsive web interface
  - Interactive dashboard with data visualization
  - Real-time data updates via REST API
  - Modern UI with gradient backgrounds and animations
  - Mobile-friendly responsive design

## 🚀 Getting Started

### Prerequisites
- Java 17 or higher
- Maven 3.6+

### Running the Application

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LCAD_Projet_2025
   ```

2. **Build and run**
   ```bash
   mvn spring-boot:run
   ```

3. **Access the application**
   - Main Application: http://localhost:8080
   - Database Console: http://localhost:8080/h2-console
   - Dashboard: http://localhost:8080/dashboard

### Database Configuration
- **JDBC URL**: `jdbc:h2:mem:testdb`
- **Username**: `sa`
- **Password**: (empty)

## 📱 Features

### Home Page
- Overview of the 3-tier architecture
- Real-time statistics display
- API operation controls
- Recent locations overview

### Dashboard
- Interactive data table with all scraped data
- Location-based filtering
- Delete operations for data management
- Real-time updates

### API Operations
- **Scrape New Data**: Generates new mock data and saves to database
- **Refresh Data**: Updates the UI with latest data
- **View Dashboard**: Navigate to detailed data view

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data` | Get all data records |
| GET | `/api/data/{id}` | Get specific data record |
| GET | `/api/data/location/{location}` | Get data by location |
| GET | `/api/data/locations` | Get all unique locations |
| GET | `/api/data/count` | Get total record count |
| POST | `/api/data` | Create new data record |
| POST | `/api/data/scrape` | Trigger data scraping |
| DELETE | `/api/data/{id}` | Delete data record |

## 🗄️ Database Schema

```sql
CREATE TABLE api_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    location VARCHAR(255) NOT NULL,
    temperature DECIMAL(5,2),
    humidity INTEGER,
    description VARCHAR(500),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎨 Technologies Used

- **Backend**: Spring Boot 3.2.0, Spring Data JPA, Spring Web
- **Database**: H2 Database (in-memory)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Build Tool**: Maven
- **Template Engine**: Thymeleaf
- **HTTP Client**: Apache HttpComponents

## 📸 Screenshots

### Home Page
![Home Page](https://github.com/user-attachments/assets/c6b99b6c-66ed-4f83-a0c3-fc2da4edfef6)

### Dashboard
![Dashboard](https://github.com/user-attachments/assets/8371118f-2881-42d6-895f-e3e97c4fbf92)

## 🔧 Development

### Project Structure
```
src/
├── main/
│   ├── java/com/lcad/projet/
│   │   ├── controller/          # REST and Web controllers
│   │   ├── model/               # JPA entities
│   │   ├── repository/          # Data access layer
│   │   ├── service/             # Business logic
│   │   └── LcadProjetApplication.java
│   └── resources/
│       ├── static/
│       │   ├── css/             # Stylesheets
│       │   └── js/              # JavaScript files
│       ├── templates/           # Thymeleaf templates
│       ├── sql/                 # Database scripts
│       └── application.properties
└── test/                        # Test files
```

### Building
```bash
mvn clean compile
mvn spring-boot:run
```

## 🌟 Key Features Demonstrated

1. **3-Tier Separation**: Clear separation of data, application, and presentation layers
2. **RESTful API**: Complete CRUD operations via REST endpoints
3. **Data Persistence**: SQL database with JPA/Hibernate integration
4. **Modern UI**: Responsive web interface with modern CSS
5. **API Integration**: Simulated external API data scraping
6. **Real-time Updates**: JavaScript-based dynamic content updates

## 📝 License

This project is for educational purposes as part of LCAD Projet 2025.