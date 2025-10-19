package com.example.refactoredbackend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.time.LocalDateTime;

@Entity
public class Event {

    @Id
    private Long id;
    private Long chemical_id;
    private String type;
    private double lat;
    private double lon;
    private double amount;
    private double heat;
    private String terrain;
    private LocalDateTime time;

    // Getters and setters
}
