package com.tournois.controller;

import com.tournois.dto.MatcheDTO;
import com.tournois.dto.MatchEventDTO;
import com.tournois.dto.MatchEventsSaveRequest;
import com.tournois.dto.ScheduleUpdate;
import com.tournois.dto.ScoreUpdate;
import com.tournois.dto.PlayerStatsUpdate;
import com.tournois.entity.Matche;
import com.tournois.entity.MatchPlayerStats;
import com.tournois.repository.MatchEventRepository;
import com.tournois.repository.MatcheRepository;
import com.tournois.repository.MatchPlayerStatsRepository;
import com.tournois.service.BracketService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MatcheController {

    private final MatcheRepository repository;
    private final BracketService bracketService;
    private final MatchEventRepository matchEventRepository;
    private final MatchPlayerStatsRepository matchPlayerStatsRepository;

    @GetMapping("/tournois/{tournoiId}/matches")
    public List<MatcheDTO> listForTournoi(@PathVariable Long tournoiId) {
        return repository.findByTournoiIdOrderByRoundAscPositionAsc(tournoiId)
                .stream().map(MatcheDTO::from).toList();
    }

    @PostMapping("/tournois/{tournoiId}/bracket")
    public List<MatcheDTO> generateBracket(@PathVariable Long tournoiId) {
        return bracketService.generate(tournoiId).stream().map(MatcheDTO::from).toList();
    }

    @PutMapping("/matches/{id}/score")
    public MatcheDTO updateScore(@PathVariable Long id, @RequestBody ScoreUpdate body) {
        if (body.getScoreEquipe1() == null || body.getScoreEquipe2() == null) {
            throw new IllegalArgumentException("Les deux scores sont requis");
        }
        Matche updated = bracketService.setScore(id, body.getScoreEquipe1(), body.getScoreEquipe2());
        return MatcheDTO.from(updated);
    }

    /** Programme un match : date/heure et lieu. */
    @PutMapping("/matches/{id}/programmation")
    public MatcheDTO updateSchedule(@PathVariable Long id, @RequestBody ScheduleUpdate body) {
        Matche m = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Match introuvable"));
        m.setDateMatch(body.getDateMatch());
        m.setLieu(body.getLieu());
        return MatcheDTO.from(repository.save(m));
    }

    @GetMapping("/matches/{id}")
    public MatcheDTO get(@PathVariable Long id) {
        return MatcheDTO.from(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Match introuvable")));
    }

    @GetMapping("/matches/{id}/player-stats")
    public List<MatchPlayerStats> getPlayerStats(@PathVariable Long id) {
        return matchPlayerStatsRepository.findByMatchId(id);
    }

    @PutMapping("/matches/{id}/player-stats")
    public List<MatchPlayerStats> updatePlayerStats(@PathVariable Long id, @RequestBody List<PlayerStatsUpdate> stats) {
        return bracketService.savePlayerStats(id, stats);
    }

    @GetMapping("/matches/{id}/events")
    public List<MatchEventDTO> getEvents(@PathVariable Long id) {
        return matchEventRepository.findByMatchIdOrderByMinuteAscIdAsc(id)
                .stream().map(MatchEventDTO::from).toList();
    }

    @PutMapping("/matches/{id}/events")
    public List<MatchEventDTO> updateEvents(@PathVariable Long id, @RequestBody MatchEventsSaveRequest body) {
        return bracketService.saveMatchEvents(id, body)
                .stream().map(MatchEventDTO::from).toList();
    }
}
