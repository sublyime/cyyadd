package com.example.refactoredbackend.repository;

import com.example.refactoredbackend.model.Weather;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WeatherRepository extends JpaRepository<Weather, Integer> {
}
