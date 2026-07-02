package com.tournois.repository;

import com.tournois.entity.Matche;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatcheRepository extends JpaRepository<Matche, Long> {
    List<Matche> findByTournoiIdOrderByRoundAscPositionAsc(Long tournoiId);
    List<Matche> findByTournoiIdAndRound(Long tournoiId, Integer round);
    void deleteByTournoiId(Long tournoiId);
}
