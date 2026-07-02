package com.tournois.repository;

import com.tournois.entity.MatchPlayerStats;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MatchPlayerStatsRepository extends JpaRepository<MatchPlayerStats, Long> {
    List<MatchPlayerStats> findByMatchId(Long matchId);
    List<MatchPlayerStats> findByJoueurId(Long joueurId);
    void deleteByMatchId(Long matchId);
}
