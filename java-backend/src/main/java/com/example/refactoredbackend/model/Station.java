package com.example.refactoredbackend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Station {

    @Id
    private String id;
    private String name;
    private double latitude;
    private double longitude;

    // Getters and setters
}
