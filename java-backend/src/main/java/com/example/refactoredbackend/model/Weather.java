package com.example.refactoredbackend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

@Entity
public class Weather {

    @Id
    private Integer id;
    private LocalDateTime time;
    private double wind_speed;
    private double wind_direction;
    private double temperature;
    private double humidity;
    private double pressure;
    private double precipitation;
    private String station_id;

    // Getters and setters
}
