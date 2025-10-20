package com.example.refactoredbackend.service;

import com.example.refactoredbackend.model.*;
import com.example.refactoredbackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DataService {

    @Autowired
    private StationRepository stationRepository;

    @Autowired
    private PlumeRepository plumeRepository;

    @Autowired
    private WeatherRepository weatherRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private ChemicalRepository chemicalRepository;

    // Station Operations
    public List<Station> getAllStations() {
        return stationRepository.findAll();
    }

    public Station createStation(String name, double lat, double lon, String provider) {
        Station station = new Station(name, lat, lon, provider);
        return stationRepository.save(station);
    }

    public void deleteStation(Long id) {
        stationRepository.deleteById(id);
    }

    // Plume Operations
    public List<Plume> getAllPlumes() {
        return plumeRepository.findAll();
    }

    // Weather Operations
    public List<Weather> getAllWeather() {
        return weatherRepository.findAll();
    }

    // Event Operations
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public Event createEvent(Event event) {
        if (event.getTime() == null) {
            event.setTime(LocalDateTime.now());
        }
        return eventRepository.save(event);
    }

    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }

    public Optional<Event> getEvent(Long id) {
        return eventRepository.findById(id);
    }

    // Chemical Operations
    public List<Chemical> getAllChemicals() {
        return chemicalRepository.findAll();
    }

    public Chemical createChemical(String name, String state) {
        Chemical chemical = new Chemical(name, state);
        return chemicalRepository.save(chemical);
    }

    public void deleteChemical(Long id) {
        chemicalRepository.deleteById(id);
    }

    public Optional<Chemical> getChemical(Long id) {
        return chemicalRepository.findById(id);
    }
}