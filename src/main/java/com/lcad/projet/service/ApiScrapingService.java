package com.lcad.projet.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lcad.projet.model.ApiData;
import com.lcad.projet.repository.ApiDataRepository;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.logging.Logger;

@Service
public class ApiScrapingService {
    
    private static final Logger logger = Logger.getLogger(ApiScrapingService.class.getName());
    
    @Autowired
    private ApiDataRepository apiDataRepository;
    
    @Value("${api.weather.base-url}")
    private String baseUrl;
    
    @Value("${api.weather.key}")
    private String apiKey;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public void scrapeAndStoreData() {
        // Sample cities to scrape data for
        List<String> cities = Arrays.asList("Paris", "London", "New York", "Tokyo", "Berlin");
        
        for (String city : cities) {
            try {
                scrapeDataForCity(city);
            } catch (Exception e) {
                logger.severe("Failed to scrape data for city: " + city + " - " + e.getMessage());
            }
        }
    }
    
    private void scrapeDataForCity(String city) throws Exception {
        // For demo purposes, we'll generate mock data instead of calling a real API
        // In a real implementation, you would make HTTP requests to an actual API
        ApiData data = generateMockData(city);
        apiDataRepository.save(data);
        logger.info("Saved data for city: " + city);
    }
    
    private ApiData generateMockData(String city) {
        // Generate mock weather data
        BigDecimal temperature = BigDecimal.valueOf(Math.random() * 30 + 10); // 10-40°C
        Integer humidity = (int) (Math.random() * 40 + 30); // 30-70%
        String[] descriptions = {"Clear sky", "Partly cloudy", "Cloudy", "Light rain", "Sunny"};
        String description = descriptions[(int) (Math.random() * descriptions.length)];
        
        return new ApiData(city, temperature, humidity, description);
    }
    
    // Real API implementation example (commented out)
    /*
    private void scrapeDataForCityFromRealAPI(String city) throws Exception {
        String url = baseUrl + "/weather?q=" + city + "&appid=" + apiKey + "&units=metric";
        
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpGet request = new HttpGet(url);
            String response = client.execute(request, httpResponse -> 
                EntityUtils.toString(httpResponse.getEntity()));
            
            JsonNode json = objectMapper.readTree(response);
            
            String location = json.get("name").asText();
            BigDecimal temperature = BigDecimal.valueOf(json.get("main").get("temp").asDouble());
            Integer humidity = json.get("main").get("humidity").asInt();
            String description = json.get("weather").get(0).get("description").asText();
            
            ApiData data = new ApiData(location, temperature, humidity, description);
            apiDataRepository.save(data);
        }
    }
    */
}