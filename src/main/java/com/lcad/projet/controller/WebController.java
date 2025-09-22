package com.lcad.projet.controller;

import com.lcad.projet.service.ApiDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {
    
    @Autowired
    private ApiDataService apiDataService;
    
    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("dataCount", apiDataService.getDataCount());
        model.addAttribute("locations", apiDataService.getAllLocations());
        return "index";
    }
    
    @GetMapping("/dashboard")
    public String dashboard(Model model) {
        model.addAttribute("allData", apiDataService.getAllData());
        model.addAttribute("locations", apiDataService.getAllLocations());
        return "dashboard";
    }
}