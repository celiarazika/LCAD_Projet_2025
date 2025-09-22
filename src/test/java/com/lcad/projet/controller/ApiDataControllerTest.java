package com.lcad.projet.controller;

import com.lcad.projet.service.ApiDataService;
import com.lcad.projet.service.ApiScrapingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ApiDataController.class)
class ApiDataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApiDataService apiDataService;
    
    @MockBean
    private ApiScrapingService apiScrapingService;

    @Test
    void shouldReturnAllData() throws Exception {
        when(apiDataService.getAllData()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/data")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }

    @Test
    void shouldReturnDataCount() throws Exception {
        when(apiDataService.getDataCount()).thenReturn(5L);

        mockMvc.perform(get("/api/data/count")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().string("5"));
    }

    @Test
    void shouldReturnAllLocations() throws Exception {
        when(apiDataService.getAllLocations()).thenReturn(Collections.singletonList("Paris"));

        mockMvc.perform(get("/api/data/locations")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}