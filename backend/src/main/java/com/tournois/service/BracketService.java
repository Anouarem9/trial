package com.tournois.service;

import com.tournois.entity.Equipe;
import com.tournois.entity.Matche;
import com.tournois.entity.Tournoi;
import com.tournois.entity.MatchPlayerStats;
import com.tournois.entity.MatchEvent;
import com.tournois.entity.Joueur;
import com.tournois.dto.MatchEventsSaveRequest;
import com.tournois.dto.MatchEventUpdate;
import com.tournois.dto.PlayerStatsUpdate;
import com.tournois.repository.EquipeRepository;
import com.tournois.repository.MatcheRepository;
import com.tournois.repository.TournoiRepository;
import com.tournois.repository.MatchEventRepository;
import com.tournois.repository.MatchPlayerStatsRepository;
import com.tournois.repository.JoueurRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class BracketService {

    private final TournoiRepository tournoiRepository;
    private final EquipeRepository equipeRepository;
    private final MatcheRepository matcheRepository;
    private final MatchEventRepository matchEventRepository;
    private final MatchPlayerStatsRepository matchPlayerStatsRepository;
    private final JoueurRepository joueurRepository;

    /**
     * Generate a single-elimination bracket for the tournament.
     * Teams count must be a power of two. Teams are shuffled and seeded into round 1.
     * Subsequent rounds are created as empty placeholders that get filled as winners advance.
     */
    @Transactional
    public List<Matche> generate(Long tournoiId) {
        Tournoi tournoi = tournoiRepository.findById(tournoiId)
                .orElseThrow(() -> new EntityNotFoundException("Tournoi introuvable"));

        List<Equipe> equipes = equipeRepository.findByTournoiId(tournoiId);
        int n = equipes.size();
        if (n < 2) {
            throw new IllegalStateException("Au moins 2 équipes sont requises");
        }
        if (Integer.bitCount(n) != 1) {
            throw new IllegalStateException("Le nombre d'équipes doit être une puissance de 2 (2, 4, 8, 16, 32...)");
        }

        // Wipe any previous bracket and dependent match records.
        List<Matche> previousMatches = matcheRepository.findByTournoiIdOrderByRoundAscPositionAsc(tournoiId);
        for (Matche previous : previousMatches) {
            matchEventRepository.deleteByMatchId(previous.getId());
            matchPlayerStatsRepository.deleteByMatchId(previous.getId());
        }
        matchEventRepository.flush();
        matchPlayerStatsRepository.flush();
        matcheRepository.deleteByTournoiId(tournoiId);
        matcheRepository.flush();

        Collections.shuffle(equipes);

        int totalRounds = Integer.numberOfTrailingZeros(n); // n=8 -> 3 rounds
        List<Matche> created = new ArrayList<>();

        // Round 1 — filled with teams
        for (int i = 0; i < n / 2; i++) {
            Matche m = new Matche();
            m.setTournoi(tournoi);
            m.setEquipe1(equipes.get(2 * i));
            m.setEquipe2(equipes.get(2 * i + 1));
            m.setRound(1);
            m.setPosition(i);
            m.setStatut(Matche.StatutMatch.A_VENIR);
            created.add(matcheRepository.save(m));
        }

        // Subsequent rounds — empty placeholders
        int matchesInRound = n / 4;
        for (int r = 2; r <= totalRounds; r++) {
            for (int i = 0; i < matchesInRound; i++) {
                Matche m = new Matche();
                m.setTournoi(tournoi);
                m.setRound(r);
                m.setPosition(i);
                m.setStatut(Matche.StatutMatch.A_VENIR);
                created.add(matcheRepository.save(m));
            }
            matchesInRound /= 2;
        }

        tournoi.setStatut(Tournoi.StatutTournoi.EN_COURS);
        tournoiRepository.save(tournoi);

        return created;
    }

    /**
     * Set the score for a match. If the match is in a non-final round, the winner advances
     * to the matching slot in the next round.
     */
    @Transactional
    public Matche setScore(Long matchId, int scoreEquipe1, int scoreEquipe2) {
        Matche match = matcheRepository.findById(matchId)
                .orElseThrow(() -> new EntityNotFoundException("Match introuvable"));

        if (match.getEquipe1() == null || match.getEquipe2() == null) {
            throw new IllegalStateException("Les deux équipes doivent être définies avant de saisir un score");
        }
        if (scoreEquipe1 == scoreEquipe2) {
            throw new IllegalStateException("L'élimination directe interdit les égalités — saisissez un vainqueur");
        }

        match.setScoreEquipe1(scoreEquipe1);
        match.setScoreEquipe2(scoreEquipe2);
        match.setStatut(Matche.StatutMatch.TERMINE);
        matcheRepository.save(match);

        Equipe vainqueur = scoreEquipe1 > scoreEquipe2 ? match.getEquipe1() : match.getEquipe2();
        advanceWinner(match, vainqueur);

        // If this is the final, mark the tournament as terminé
        Long tournoiId = match.getTournoi().getId();
        List<Matche> all = matcheRepository.findByTournoiIdOrderByRoundAscPositionAsc(tournoiId);
        int maxRound = all.stream().mapToInt(Matche::getRound).max().orElse(0);
        boolean finalDone = all.stream()
                .filter(x -> x.getRound() == maxRound)
                .allMatch(x -> x.getStatut() == Matche.StatutMatch.TERMINE);
        if (finalDone) {
            Tournoi t = match.getTournoi();
            t.setStatut(Tournoi.StatutTournoi.TERMINE);
            tournoiRepository.save(t);
        }

        return match;
    }

    private void advanceWinner(Matche current, Equipe vainqueur) {
        int nextRound = current.getRound() + 1;
        int nextPosition = current.getPosition() / 2;
        List<Matche> next = matcheRepository.findByTournoiIdAndRound(current.getTournoi().getId(), nextRound);
        if (next.isEmpty()) return; // current was the final

        Matche target = next.stream()
                .filter(m -> m.getPosition().equals(nextPosition))
                .findFirst()
                .orElse(null);
        if (target == null) return;

        // Even position -> equipe1 slot, odd position -> equipe2 slot
        if (current.getPosition() % 2 == 0) {
            target.setEquipe1(vainqueur);
        } else {
            target.setEquipe2(vainqueur);
        }
        matcheRepository.save(target);
    }

    /**
     * Clear and update match player statistics, then recalculate aggregate stats for all players of the two teams.
     */
    @Transactional
    public List<MatchPlayerStats> savePlayerStats(Long matchId, List<PlayerStatsUpdate> statsUpdates) {
        Matche match = matcheRepository.findById(matchId)
                .orElseThrow(() -> new EntityNotFoundException("Match introuvable"));

        // Delete existing stats for this match
        matchPlayerStatsRepository.deleteByMatchId(matchId);
        matchPlayerStatsRepository.flush();

        List<MatchPlayerStats> savedStats = new ArrayList<>();
        Set<Long> affectedPlayerIds = new HashSet<>();

        for (PlayerStatsUpdate u : statsUpdates) {
            Joueur joueur = joueurRepository.findById(u.getJoueurId())
                    .orElseThrow(() -> new EntityNotFoundException("Joueur introuvable: " + u.getJoueurId()));

            MatchPlayerStats mps = new MatchPlayerStats();
            mps.setMatch(match);
            mps.setJoueur(joueur);
            mps.setButs(u.getButs() != null ? u.getButs() : 0);
            mps.setPassesDecisives(u.getPassesDecisives() != null ? u.getPassesDecisives() : 0);
            mps.setCartonsJaunes(u.getCartonsJaunes() != null ? u.getCartonsJaunes() : 0);
            mps.setCartonsRouges(u.getCartonsRouges() != null ? u.getCartonsRouges() : 0);

            savedStats.add(matchPlayerStatsRepository.save(mps));
            affectedPlayerIds.add(joueur.getId());
        }

        // Identify and recalculate stats for all players of both teams in this match
        List<Joueur> teamPlayers = new ArrayList<>();
        if (match.getEquipe1() != null) {
            teamPlayers.addAll(joueurRepository.findByEquipeId(match.getEquipe1().getId()));
        }
        if (match.getEquipe2() != null) {
            teamPlayers.addAll(joueurRepository.findByEquipeId(match.getEquipe2().getId()));
        }

        for (Joueur j : teamPlayers) {
            List<MatchPlayerStats> allPlayerStats = matchPlayerStatsRepository.findByJoueurId(j.getId());
            int totalButs = 0;
            int totalPasses = 0;
            int totalJaunes = 0;
            int totalRouges = 0;
            int totalMatches = 0;

            for (MatchPlayerStats mps : allPlayerStats) {
                totalMatches++;
                totalButs += mps.getButs();
                totalPasses += mps.getPassesDecisives();
                totalJaunes += mps.getCartonsJaunes();
                totalRouges += mps.getCartonsRouges();
            }

            j.setMatchsJoues(totalMatches);
            j.setButs(totalButs);
            j.setPassesDecisives(totalPasses);
            j.setCartonsJaunes(totalJaunes);
            j.setCartonsRouges(totalRouges);
            joueurRepository.save(j);
        }

        return savedStats;
    }

    @Transactional
    public List<MatchEvent> saveMatchEvents(Long matchId, MatchEventsSaveRequest request) {
        Matche match = matcheRepository.findById(matchId)
                .orElseThrow(() -> new EntityNotFoundException("Match introuvable"));

        if (match.getEquipe1() == null || match.getEquipe2() == null) {
            throw new IllegalStateException("Les deux equipes doivent etre definies avant de saisir les evenements");
        }

        List<MatchEventUpdate> events = request == null || request.getEvents() == null
                ? List.of()
                : request.getEvents();
        Set<Long> playedPlayerIds = new LinkedHashSet<>();
        if (request != null && request.getPlayedPlayerIds() != null) {
            playedPlayerIds.addAll(request.getPlayedPlayerIds());
        }

        List<Joueur> teamPlayers = playersForMatch(match);
        Map<Long, Joueur> allowedPlayers = new HashMap<>();
        for (Joueur joueur : teamPlayers) {
            allowedPlayers.put(joueur.getId(), joueur);
        }
        if (playedPlayerIds.isEmpty()) {
            for (Joueur joueur : teamPlayers) {
                playedPlayerIds.add(joueur.getId());
            }
        }

        for (Long playerId : playedPlayerIds) {
            if (!allowedPlayers.containsKey(playerId)) {
                throw new IllegalArgumentException("Un participant ne fait pas partie des equipes du match");
            }
        }

        matchEventRepository.deleteByMatchId(matchId);
        matchEventRepository.flush();

        List<MatchEvent> savedEvents = new ArrayList<>();
        Map<Long, PlayerStatsUpdate> derivedStats = new HashMap<>();

        for (Long playerId : playedPlayerIds) {
            statsFor(derivedStats, playerId);
        }

        for (MatchEventUpdate update : events) {
            MatchEvent event = buildEvent(match, update, allowedPlayers);
            savedEvents.add(matchEventRepository.save(event));

            Joueur joueur = event.getJoueur();
            playedPlayerIds.add(joueur.getId());
            PlayerStatsUpdate playerStats = statsFor(derivedStats, joueur.getId());

            if (event.getType() == MatchEvent.Type.BUT) {
                playerStats.setButs(playerStats.getButs() + 1);
                if (event.getAssistJoueur() != null) {
                    Long assistPlayerId = event.getAssistJoueur().getId();
                    playedPlayerIds.add(assistPlayerId);
                    PlayerStatsUpdate assistStats = statsFor(derivedStats, assistPlayerId);
                    assistStats.setPassesDecisives(assistStats.getPassesDecisives() + 1);
                }
            } else if (event.getType() == MatchEvent.Type.CARTON_JAUNE) {
                playerStats.setCartonsJaunes(playerStats.getCartonsJaunes() + 1);
            } else if (event.getType() == MatchEvent.Type.CARTON_ROUGE) {
                playerStats.setCartonsRouges(playerStats.getCartonsRouges() + 1);
            }
        }

        savePlayerStats(matchId, new ArrayList<>(derivedStats.values()));
        return matchEventRepository.findByMatchIdOrderByMinuteAscIdAsc(matchId);
    }

    private MatchEvent buildEvent(Matche match, MatchEventUpdate update, Map<Long, Joueur> allowedPlayers) {
        if (update == null) {
            throw new IllegalArgumentException("Evenement invalide");
        }
        if (update.getType() == null) {
            throw new IllegalArgumentException("Le type d'evenement est requis");
        }
        if (update.getJoueurId() == null) {
            throw new IllegalArgumentException("Le joueur de l'evenement est requis");
        }

        Joueur joueur = allowedPlayers.get(update.getJoueurId());
        if (joueur == null) {
            throw new IllegalArgumentException("Le joueur ne fait pas partie des equipes du match");
        }

        int minute = update.getMinute() == null ? 0 : update.getMinute();
        if (minute < 0 || minute > 130) {
            throw new IllegalArgumentException("La minute doit etre comprise entre 0 et 130");
        }

        Joueur assistJoueur = null;
        if (update.getType() == MatchEvent.Type.BUT && update.getAssistJoueurId() != null) {
            if (update.getAssistJoueurId().equals(update.getJoueurId())) {
                throw new IllegalArgumentException("Un joueur ne peut pas s'assister lui-meme");
            }
            assistJoueur = allowedPlayers.get(update.getAssistJoueurId());
            if (assistJoueur == null) {
                throw new IllegalArgumentException("Le passeur ne fait pas partie des equipes du match");
            }
            Long scorerTeamId = joueur.getEquipe() == null ? null : joueur.getEquipe().getId();
            Long assistTeamId = assistJoueur.getEquipe() == null ? null : assistJoueur.getEquipe().getId();
            if (scorerTeamId == null || !scorerTeamId.equals(assistTeamId)) {
                throw new IllegalArgumentException("Le passeur doit appartenir a la meme equipe que le buteur");
            }
        }

        MatchEvent event = new MatchEvent();
        event.setMatch(match);
        event.setJoueur(joueur);
        event.setAssistJoueur(assistJoueur);
        event.setType(update.getType());
        event.setMinute(minute);
        return event;
    }

    private List<Joueur> playersForMatch(Matche match) {
        List<Joueur> teamPlayers = new ArrayList<>();
        if (match.getEquipe1() != null) {
            teamPlayers.addAll(joueurRepository.findByEquipeId(match.getEquipe1().getId()));
        }
        if (match.getEquipe2() != null) {
            teamPlayers.addAll(joueurRepository.findByEquipeId(match.getEquipe2().getId()));
        }
        return teamPlayers;
    }

    private PlayerStatsUpdate statsFor(Map<Long, PlayerStatsUpdate> statsByPlayer, Long playerId) {
        return statsByPlayer.computeIfAbsent(playerId, id -> {
            PlayerStatsUpdate stats = new PlayerStatsUpdate();
            stats.setJoueurId(id);
            stats.setButs(0);
            stats.setPassesDecisives(0);
            stats.setCartonsJaunes(0);
            stats.setCartonsRouges(0);
            return stats;
        });
    }
}
