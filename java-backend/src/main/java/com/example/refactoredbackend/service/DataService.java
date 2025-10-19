package com.example.refactoredbackend.service;

import com.example.refactoredbackend.model.*;
import com.example.refactoredbackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public List<Station> getAllStations() {
        return stationRepository.findAll();
    }

    public List<Plume> getAllPlumes() {
        return plumeRepository.findAll();
    }

    public List<Weather> getAllWeather() {
        return weatherRepository.findAll();
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public Event createEvent(Event event) {
        return eventRepository.save(event);
    }

    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }

    public List<Chemical> getAllChemicals() {
        return chemicalRepository.findAll();
    }
}
