package com.lcad.projet.service;

import com.lcad.projet.model.ApiData;
import com.lcad.projet.repository.ApiDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ApiDataService {
    
    @Autowired
    private ApiDataRepository apiDataRepository;
    
    public List<ApiData> getAllData() {
        return apiDataRepository.findAllOrderByCreatedAtDesc();
    }
    
    public Optional<ApiData> getDataById(Long id) {
        return apiDataRepository.findById(id);
    }
    
    public List<ApiData> getDataByLocation(String location) {
        return apiDataRepository.findByLocation(location);
    }
    
    public List<String> getAllLocations() {
        return apiDataRepository.findDistinctLocations();
    }
    
    public ApiData saveData(ApiData data) {
        return apiDataRepository.save(data);
    }
    
    public void deleteData(Long id) {
        apiDataRepository.deleteById(id);
    }
    
    public long getDataCount() {
        return apiDataRepository.count();
    }
}