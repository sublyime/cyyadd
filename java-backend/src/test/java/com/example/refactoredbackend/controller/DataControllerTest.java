package com.example.refactoredbackend.controller;

import com.example.refactoredbackend.model.*;
import com.example.refactoredbackend.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class DataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testHealthEndpoint() throws Exception {
        mockMvc.perform(MockMvcRequestBuilders.get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("dispersion-modeling-api"));
    }

    @Test
    public void testStationOperations() throws Exception {
        // Create station
        mockMvc.perform(MockMvcRequestBuilders.post("/api/stations")
                .param("name", "Test Station")
                .param("lat", "45.0")
                .param("lon", "-122.0")
                .param("provider", "test-provider"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Station"));

        // Get all stations
        mockMvc.perform(MockMvcRequestBuilders.get("/api/stations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    public void testChemicalOperations() throws Exception {
        // Create chemical
        mockMvc.perform(MockMvcRequestBuilders.post("/api/chemicals")
                .param("name", "Test Chemical")
                .param("state", "gas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Chemical"));

        // Get all chemicals
        mockMvc.perform(MockMvcRequestBuilders.get("/api/chemicals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    public void testEventOperations() throws Exception {
        // Create chemical first
        mockMvc.perform(MockMvcRequestBuilders.post("/api/chemicals")
                .param("name", "Test Chemical")
                .param("state", "gas"))
                .andExpect(status().isOk());

        // Create event object
        Event event = new Event();
        event.setName("Test Event");
        event.setDescription("Test Description");
        event.setTime(LocalDateTime.now());
        
        // Get the chemical and set it
        Chemical chemical = new Chemical("Test Chemical", "gas");
        chemical.setId(1L);
        event.setChemical(chemical);

        // Create event
        String eventJson = objectMapper.writeValueAsString(event);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/events")
                .contentType(MediaType.APPLICATION_JSON)
                .content(eventJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Event"));

        // Get all events
        mockMvc.perform(MockMvcRequestBuilders.get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    public void testPlumeOperations() throws Exception {
        // Create plume object
        Plume plume = new Plume();
        plume.setTime(LocalDateTime.now());
        plume.setSo2_ppb(10.0);
        plume.setWind_speed_ms(5.0);
        plume.setWind_dir_deg(180.0);

        // Create plume
        String plumeJson = objectMapper.writeValueAsString(plume);
        mockMvc.perform(MockMvcRequestBuilders.post("/api/plumes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(plumeJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.so2_ppb").value(10.0));

        // Get all plumes
        mockMvc.perform(MockMvcRequestBuilders.get("/api/plumes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    public void testWeatherEndpoints() throws Exception {
        // Get latest weather
        mockMvc.perform(MockMvcRequestBuilders.get("/api/weather/latest"))
                .andExpect(status().isOk());

        // Get weather from Open-Meteo
        mockMvc.perform(MockMvcRequestBuilders.get("/api/weather/open-meteo")
                .param("lat", "45.0")
                .param("lon", "-122.0"))
                .andExpect(status().isOk());
    }

    @Test
    public void testDispersionModelEndpoints() throws Exception {
        // Test plume model
        String plumeParams = "{\"windSpeed\": 5.0, \"windDirection\": 180.0, \"stabilityClass\": 3.0}";
        mockMvc.perform(MockMvcRequestBuilders.post("/api/model/plume")
                .contentType(MediaType.APPLICATION_JSON)
                .content(plumeParams))
                .andExpect(status().isOk());

        // Test puff model
        String puffParams = "{\"windSpeed\": 5.0, \"windDirection\": 180.0, \"stabilityClass\": 3.0}";
        mockMvc.perform(MockMvcRequestBuilders.post("/api/model/puff")
                .contentType(MediaType.APPLICATION_JSON)
                .content(puffParams))
                .andExpect(status().isOk());
    }
}