package com.example.refactoredbackend.repository;

import com.example.refactoredbackend.model.Plume;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlumeRepository extends JpaRepository<Plume, Long> {
}
