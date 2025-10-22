package com.example.refactoredbackend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "plume")
public class Plume {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "plume_id_seq")
    @SequenceGenerator(name = "plume_id_seq", sequenceName = "plume_id_seq", allocationSize = 1)
    @Column(nullable = false)
    private Long id;
    private LocalDateTime time;
    private LocalDateTime time_obs;
    private double so2_ppb;
    private double so2_error_ppb;
    private double so2_flag;
    private double wind_dir_deg;
    private double wind_speed_ms;
    private double wind_dir_error_deg;
    private double wind_speed_error_ms;
    private String species;
    private LocalDateTime time_forecast;
    private double so2_ppb_forecast;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id")
    private Station station;

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getTime() {
        return time;
    }

    public void setTime(LocalDateTime time) {
        this.time = time;
    }

    public LocalDateTime getTime_obs() {
        return time_obs;
    }

    public void setTime_obs(LocalDateTime time_obs) {
        this.time_obs = time_obs;
    }

    public double getSo2_ppb() {
        return so2_ppb;
    }

    public void setSo2_ppb(double so2_ppb) {
        this.so2_ppb = so2_ppb;
    }

    public double getSo2_error_ppb() {
        return so2_error_ppb;
    }

    public void setSo2_error_ppb(double so2_error_ppb) {
        this.so2_error_ppb = so2_error_ppb;
    }

    public double getSo2_flag() {
        return so2_flag;
    }

    public void setSo2_flag(double so2_flag) {
        this.so2_flag = so2_flag;
    }

    public double getWind_dir_deg() {
        return wind_dir_deg;
    }

    public void setWind_dir_deg(double wind_dir_deg) {
        this.wind_dir_deg = wind_dir_deg;
    }

    public double getWind_speed_ms() {
        return wind_speed_ms;
    }

    public void setWind_speed_ms(double wind_speed_ms) {
        this.wind_speed_ms = wind_speed_ms;
    }

    public double getWind_dir_error_deg() {
        return wind_dir_error_deg;
    }

    public void setWind_dir_error_deg(double wind_dir_error_deg) {
        this.wind_dir_error_deg = wind_dir_error_deg;
    }

    public double getWind_speed_error_ms() {
        return wind_speed_error_ms;
    }

    public void setWind_speed_error_ms(double wind_speed_error_ms) {
        this.wind_speed_error_ms = wind_speed_error_ms;
    }

    public Station getStation() {
        return station;
    }

    public void setStation(Station station) {
        this.station = station;
    }

    public String getSpecies() {
        return species;
    }

    public void setSpecies(String species) {
        this.species = species;
    }

    public LocalDateTime getTime_forecast() {
        return time_forecast;
    }

    public void setTime_forecast(LocalDateTime time_forecast) {
        this.time_forecast = time_forecast;
    }

    public double getSo2_ppb_forecast() {
        return so2_ppb_forecast;
    }

    public void setSo2_ppb_forecast(double so2_ppb_forecast) {
        this.so2_ppb_forecast = so2_ppb_forecast;
    }
}
