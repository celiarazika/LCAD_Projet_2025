package com.lcad.projet.controller;

import com.lcad.projet.model.ApiData;
import com.lcad.projet.service.ApiDataService;
import com.lcad.projet.service.ApiScrapingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/data")
@CrossOrigin(origins = "*")
public class ApiDataController {
    
    @Autowired
    private ApiDataService apiDataService;
    
    @Autowired
    private ApiScrapingService apiScrapingService;
    
    @GetMapping
    public List<ApiData> getAllData() {
        return apiDataService.getAllData();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiData> getDataById(@PathVariable Long id) {
        Optional<ApiData> data = apiDataService.getDataById(id);
        return data.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/location/{location}")
    public List<ApiData> getDataByLocation(@PathVariable String location) {
        return apiDataService.getDataByLocation(location);
    }
    
    @GetMapping("/locations")
    public List<String> getAllLocations() {
        return apiDataService.getAllLocations();
    }
    
    @PostMapping
    public ApiData createData(@RequestBody ApiData data) {
        return apiDataService.saveData(data);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteData(@PathVariable Long id) {
        if (apiDataService.getDataById(id).isPresent()) {
            apiDataService.deleteData(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @PostMapping("/scrape")
    public ResponseEntity<String> triggerScraping() {
        try {
            apiScrapingService.scrapeAndStoreData();
            return ResponseEntity.ok("Data scraping completed successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error during scraping: " + e.getMessage());
        }
    }
    
    @GetMapping("/count")
    public long getDataCount() {
        return apiDataService.getDataCount();
    }
}