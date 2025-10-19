package com.example.refactoredbackend.repository;

import com.example.refactoredbackend.model.Chemical;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChemicalRepository extends JpaRepository<Chemical, Long> {
}
