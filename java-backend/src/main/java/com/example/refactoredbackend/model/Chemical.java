package com.example.refactoredbackend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Chemical {

    @Id
    private Long id;
    private String name;
    private String state;

    // Getters and setters
}
