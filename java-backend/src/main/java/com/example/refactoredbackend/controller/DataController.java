package com.example.refactoredbackend.controller;

import com.example.refactoredbackend.model.*;
import com.example.refactoredbackend.service.DataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class DataController {

    @Autowired
    private DataService dataService;

    @GetMapping("/stations")
    public List<Station> getAllStations() {
        return dataService.getAllStations();
    }

    @GetMapping("/plumes")
    public List<Plume> getAllPlumes() {
        return dataService.getAllPlumes();
    }

    @GetMapping("/weather")
    public List<Weather> getAllWeather() {
        return dataService.getAllWeather();
    }

    @GetMapping("/events")
    public List<Event> getAllEvents() {
        return dataService.getAllEvents();
    }

    @PostMapping("/events")
    public Event createEvent(@RequestBody Event event) {
        return dataService.createEvent(event);
    }

    @DeleteMapping("/events/{id}")
    public void deleteEvent(@PathVariable Long id) {
        dataService.deleteEvent(id);
    }

    @GetMapping("/chemicals")
    public List<Chemical> getAllChemicals() {
        return dataService.getAllChemicals();
    }
}
