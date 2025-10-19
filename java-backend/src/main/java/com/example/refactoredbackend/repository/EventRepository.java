package com.example.refactoredbackend.repository;

import com.example.refactoredbackend.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
}
