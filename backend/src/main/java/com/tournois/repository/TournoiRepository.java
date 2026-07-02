package com.tournois.repository;

import com.tournois.entity.Tournoi;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TournoiRepository extends JpaRepository<Tournoi, Long> {
}
