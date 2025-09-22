package com.lcad.projet.repository;

import com.lcad.projet.model.ApiData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApiDataRepository extends JpaRepository<ApiData, Long> {
    
    List<ApiData> findByLocation(String location);
    
    @Query("SELECT a FROM ApiData a ORDER BY a.createdAt DESC")
    List<ApiData> findAllOrderByCreatedAtDesc();
    
    @Query("SELECT DISTINCT a.location FROM ApiData a")
    List<String> findDistinctLocations();
}