package com.example.refactoredbackend.controller;

import com.example.refactoredbackend.model.*;
import com.example.refactoredbackend.service.DataService;
import com.example.refactoredbackend.service.DispersionService;
import com.example.refactoredbackend.service.WeatherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
public class DataController {

    @Autowired
    private DataService dataService;

    @Autowired
    private DispersionService dispersionService;

    @Autowired
    private WeatherService weatherService;

    // ============ STATIONS ============
    @GetMapping("/stations")
    public ResponseEntity<List<Station>> getAllStations() {
        return ResponseEntity.ok(dataService.getAllStations());
    }

    @PostMapping("/stations")
    public ResponseEntity<Station> createStation(
            @RequestParam String name,
            @RequestParam double lat,
            @RequestParam double lon,
            @RequestParam(defaultValue = "open-meteo") String provider) {
        Station station = dataService.createStation(name, lat, lon, provider);
        return ResponseEntity.ok(station);
    }

    @DeleteMapping("/stations/{id}")
    public ResponseEntity<Void> deleteStation(@PathVariable Long id) {
        dataService.deleteStation(id);
        return ResponseEntity.noContent().build();
    }

    // ============ EVENTS ============
    @GetMapping("/events")
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(dataService.getAllEvents());
    }

    @PostMapping("/events")
    public ResponseEntity<Event> createEvent(@RequestBody Event event) {
        Event createdEvent = dataService.createEvent(event);
        return ResponseEntity.ok(createdEvent);
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable Long id) {
        dataService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<Event> getEvent(@PathVariable Long id) {
        return dataService.getEvent(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ============ CHEMICALS ============
    @GetMapping("/chemicals")
    public ResponseEntity<List<Chemical>> getAllChemicals() {
        return ResponseEntity.ok(dataService.getAllChemicals());
    }

    @PostMapping("/chemicals")
    public ResponseEntity<Chemical> createChemical(@RequestBody Chemical chemical) {
        Chemical createdChemical = dataService.createChemical(chemical);
        return ResponseEntity.ok(createdChemical);
    }

    @DeleteMapping("/chemicals/{id}")
    public ResponseEntity<Void> deleteChemical(@PathVariable Long id) {
        dataService.deleteChemical(id);
        return ResponseEntity.noContent().build();
    }

    // ============ PLUMES ============
    @GetMapping("/plumes")
    public ResponseEntity<List<Plume>> getAllPlumes() {
        return ResponseEntity.ok(dataService.getAllPlumes());
    }

    @PostMapping("/plumes")
    public ResponseEntity<Plume> createPlume(@RequestBody Plume plume) {
        Plume createdPlume = dataService.createPlume(plume);
        return ResponseEntity.ok(createdPlume);
    }

    @GetMapping("/plumes/{id}")
    public ResponseEntity<Plume> getPlume(@PathVariable Long id) {
        return dataService.getPlume(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/plumes/{id}")
    public ResponseEntity<Plume> updatePlume(
            @PathVariable Long id,
            @RequestBody Plume plume) {
        plume.setId(id);
        Plume updatedPlume = dataService.updatePlume(plume);
        return ResponseEntity.ok(updatedPlume);
    }

    @DeleteMapping("/plumes/{id}")
    public ResponseEntity<Void> deletePlume(@PathVariable Long id) {
        dataService.deletePlume(id);
        return ResponseEntity.noContent().build();
    }

    // ============ WEATHER ============
    @GetMapping("/weather")
    public ResponseEntity<List<Weather>> getAllWeather() {
        return ResponseEntity.ok(dataService.getAllWeather());
    }

    @GetMapping("/weather/latest")
    public ResponseEntity<Map<String, Object>> getLatestWeather() {
        return ResponseEntity.ok(weatherService.getLatestWeather());
    }

    @PostMapping("/weather/store")
    public ResponseEntity<Weather> storeWeatherData(@RequestBody Map<String, Object> data) {
        Weather weather = weatherService.storeWeatherData(data);
        return ResponseEntity.ok(weather);
    }

    @GetMapping("/weather/open-meteo")
    public ResponseEntity<Map<String, Object>> getWeatherOpenMeteo(
            @RequestParam double lat,
            @RequestParam double lon) {
        Map<String, Object> weather = weatherService.getWeatherFromOpenMeteo(lat, lon);
        return ResponseEntity.ok(weather);
    }

    @GetMapping("/weather/noaa")
    public ResponseEntity<Map<String, Object>> getWeatherNOAA(
            @RequestParam double lat,
            @RequestParam double lon) {
        Map<String, Object> weather = weatherService.getWeatherFromNOAA(lat, lon);
        return ResponseEntity.ok(weather);
    }

    @GetMapping("/weather/location")
    public ResponseEntity<Map<String, Object>> getWeatherForLocation(
            @RequestParam double lat,
            @RequestParam double lon) {
        Map<String, Object> weather = weatherService.getWeatherFromOpenMeteo(lat, lon);
        return ResponseEntity.ok(weather);
    }

    // ============ DISPERSION MODELS ============
    @PostMapping("/model/plume")
    public ResponseEntity<Map<String, Object>> calculatePlume(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = dispersionService.calculatePlume(params);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/model/puff")
    public ResponseEntity<Map<String, Object>> calculatePuff(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = dispersionService.calculatePuff(params);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/model/instantaneous")
    public ResponseEntity<Map<String, Object>> calculateInstantaneous(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = dispersionService.calculateInstantaneous(params);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/model/run-grid")
    public ResponseEntity<Map<String, Object>> runModelGrid(@RequestBody Map<String, Object> params) {
        String modelType = (String) params.get("model_type");
        List<Map<String, Object>> gridPoints = new ArrayList<>();
        
        double[] distances = {50, 100, 200, 300, 500, 1000};
        double[] offsets = {-50, -25, 0, 25, 50};
        
        for (double x : distances) {
            for (double y : offsets) {
                Map<String, Object> pointParams = new HashMap<>(params);
                pointParams.put("x", x);
                pointParams.put("y", y);
                
                Map<String, Object> result;
                switch (modelType) {
                    case "puff":
                        result = dispersionService.calculatePuff(pointParams);
                        break;
                    case "instantaneous":
                        result = dispersionService.calculateInstantaneous(pointParams);
                        break;
                    default:
                        result = dispersionService.calculatePlume(pointParams);
                }
                
                Map<String, Object> gridPoint = new HashMap<>();
                gridPoint.put("x", x);
                gridPoint.put("y", y);
                gridPoint.put("concentration", result.get("concentration"));
                gridPoints.add(gridPoint);
            }
        }
        
        double maxConcentration = gridPoints.stream()
            .mapToDouble(p -> ((Number) p.get("concentration")).doubleValue())
            .max()
            .orElse(0.0);
        
        Map<String, Object> response = new HashMap<>();
        response.put("type", modelType);
        response.put("grid", gridPoints);
        response.put("max_concentration", maxConcentration);
        response.put("stability_class", params.get("stability_class"));
        
        return ResponseEntity.ok(response);
    }

    // ============ HEALTH CHECK ============
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "dispersion-modeling-api"));
    }
}