package com.tournois.controller;

import com.tournois.entity.Equipe;
import com.tournois.entity.Tournoi;
import com.tournois.repository.EquipeRepository;
import com.tournois.repository.TournoiRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/tournois")
@RequiredArgsConstructor
public class TournoiController {

    private final TournoiRepository repository;
    private final EquipeRepository equipeRepository;

    @GetMapping
    @Transactional
    public List<Tournoi> list() {
        return repository.findAll().stream().map(this::syncStatus).toList();
    }

    @GetMapping("/{id}")
    @Transactional
    public Tournoi get(@PathVariable Long id) {
        return syncStatus(repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Tournoi introuvable")));
    }

    @PostMapping
    public Tournoi create(@Valid @RequestBody Tournoi tournoi) {
        tournoi.setId(null);
        applyAutomaticStatus(tournoi);
        return repository.save(tournoi);
    }

    @PutMapping("/{id}")
    public Tournoi update(@PathVariable Long id, @Valid @RequestBody Tournoi data) {
        Tournoi t = repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Tournoi introuvable"));
        t.setNom(data.getNom());
        t.setLieu(data.getLieu());
        t.setDateDebut(data.getDateDebut());
        t.setDateFin(data.getDateFin());
        t.setNombreEquipes(data.getNombreEquipes());
        t.setDescription(data.getDescription());
        applyAutomaticStatus(t);
        return repository.save(t);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /** Inscrit une équipe au tournoi (limite : tournoi.nombreEquipes). */
    @PostMapping("/{id}/equipes/{equipeId}")
    @Transactional
    public Tournoi registerEquipe(@PathVariable Long id, @PathVariable Long equipeId) {
        Tournoi t = repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Tournoi introuvable"));
        Equipe e = equipeRepository.findById(equipeId).orElseThrow(() -> new EntityNotFoundException("Équipe introuvable"));
        if (t.getEquipes().contains(e)) {
            throw new IllegalStateException("Équipe déjà inscrite à ce tournoi");
        }
        if (t.getEquipes().size() >= t.getNombreEquipes()) {
            throw new IllegalStateException("Le tournoi est complet (" + t.getNombreEquipes() + " équipes)");
        }
        t.getEquipes().add(e);
        return repository.save(t);
    }

    /** Désinscrit une équipe du tournoi. */
    @DeleteMapping("/{id}/equipes/{equipeId}")
    @Transactional
    public ResponseEntity<Void> unregisterEquipe(@PathVariable Long id, @PathVariable Long equipeId) {
        Tournoi t = repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Tournoi introuvable"));
        t.getEquipes().removeIf(e -> e.getId().equals(equipeId));
        repository.save(t);
        return ResponseEntity.noContent().build();
    }

    private Tournoi syncStatus(Tournoi tournoi) {
        Tournoi.StatutTournoi before = tournoi.getStatut();
        applyAutomaticStatus(tournoi);
        if (before != tournoi.getStatut()) {
            return repository.save(tournoi);
        }
        return tournoi;
    }

    private void applyAutomaticStatus(Tournoi tournoi) {
        tournoi.setStatut(statusFor(tournoi));
    }

    private Tournoi.StatutTournoi statusFor(Tournoi tournoi) {
        LocalDate today = LocalDate.now();
        if (tournoi.getDateDebut() != null && today.isBefore(tournoi.getDateDebut())) {
            return Tournoi.StatutTournoi.A_VENIR;
        }
        if (tournoi.getDateFin() != null && today.isAfter(tournoi.getDateFin())) {
            return Tournoi.StatutTournoi.TERMINE;
        }
        return Tournoi.StatutTournoi.EN_COURS;
    }
}
