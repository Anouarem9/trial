package com.tournois.repository;

import com.tournois.entity.MatchEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MatchEventRepository extends JpaRepository<MatchEvent, Long> {
    List<MatchEvent> findByMatchIdOrderByMinuteAscIdAsc(Long matchId);
    void deleteByMatchId(Long matchId);
}
