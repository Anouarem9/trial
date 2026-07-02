package com.tournois.controller;

import com.tournois.entity.Equipe;
import com.tournois.repository.EquipeRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/equipes")
@RequiredArgsConstructor
public class EquipeController {

    private final EquipeRepository repository;

    @GetMapping
    public List<Equipe> list(@RequestParam(required = false) Long tournoiId) {
        if (tournoiId != null) return repository.findByTournoiId(tournoiId);
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Equipe get(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Équipe introuvable"));
    }

    /** Tournaments this team is registered to (id + name only). */
    @GetMapping("/{id}/tournois")
    public List<Map<String, Object>> participations(@PathVariable Long id) {
        Equipe e = repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Équipe introuvable"));
        return e.getTournois().stream()
            .map(t -> Map.<String, Object>of("id", t.getId(), "nom", t.getNom(), "statut", t.getStatut()))
            .toList();
    }

    @PostMapping
    public Equipe create(@Valid @RequestBody EquipeRequest req) {
        Equipe e = new Equipe();
        apply(e, req);
        return repository.save(e);
    }

    @PutMapping("/{id}")
    public Equipe update(@PathVariable Long id, @RequestBody EquipeRequest req) {
        Equipe e = repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Équipe introuvable"));
        apply(e, req);
        return repository.save(e);
    }

    private void apply(Equipe e, EquipeRequest req) {
        e.setNom(req.getNom());
        e.setVille(req.getVille());
        e.setEntraineur(req.getEntraineur());
        if (req.getLogoUrl() != null) e.setLogoUrl(req.getLogoUrl());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @lombok.Data
    public static class EquipeRequest {
        @jakarta.validation.constraints.NotBlank
        private String nom;
        private String ville;
        private String entraineur;
        private String logoUrl;
    }
}
