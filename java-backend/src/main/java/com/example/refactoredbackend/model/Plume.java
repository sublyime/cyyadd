package com.example.refactoredbackend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

@Entity
public class Plume {

    @Id
    private Integer id;
    private LocalDateTime time_obs;
    private double so2_ppb;
    private double so2_error_ppb;
    private double so2_flag;
    private double wind_dir_deg;
    private double wind_speed_ms;
    private double wind_dir_error_deg;
    private double wind_speed_error_ms;
    private String station_id;
    private String species;
    private LocalDateTime time_forecast;
    private double so2_ppb_forecast;

    // Getters and setters
}
