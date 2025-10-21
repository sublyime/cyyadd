package com.example.refactoredbackend.repository;

import com.example.refactoredbackend.model.Station;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StationRepository extends JpaRepository<Station, Long> {
}
