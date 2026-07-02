package com.tournois.repository;

import com.tournois.entity.Equipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EquipeRepository extends JpaRepository<Equipe, Long> {

    @Query("SELECT e FROM Tournoi t JOIN t.equipes e WHERE t.id = :tournoiId ORDER BY e.nom")
    List<Equipe> findByTournoiId(@Param("tournoiId") Long tournoiId);

    @Query("SELECT COUNT(e) FROM Tournoi t JOIN t.equipes e WHERE t.id = :tournoiId")
    long countByTournoiId(@Param("tournoiId") Long tournoiId);
}
