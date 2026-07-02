package com.tournois.controller;

import com.tournois.entity.Equipe;
import com.tournois.entity.Joueur;
import com.tournois.repository.EquipeRepository;
import com.tournois.repository.JoueurRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/joueurs")
@RequiredArgsConstructor
public class JoueurController {

    private final JoueurRepository repository;
    private final EquipeRepository equipeRepository;

    @GetMapping
    public List<Joueur> list(@RequestParam(required = false) Long equipeId) {
        if (equipeId != null) return repository.findByEquipeId(equipeId);
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Joueur get(@PathVariable Long id) {
        return repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Joueur introuvable"));
    }

    @PostMapping
    public Joueur create(@Valid @RequestBody JoueurRequest req) {
        Joueur j = new Joueur();
        apply(j, req);
        return repository.save(j);
    }

    @PutMapping("/{id}")
    public Joueur update(@PathVariable Long id, @Valid @RequestBody JoueurRequest req) {
        Joueur j = repository.findById(id).orElseThrow(() -> new EntityNotFoundException("Joueur introuvable"));
        apply(j, req);
        return repository.save(j);
    }

    private void apply(Joueur j, JoueurRequest req) {
        Equipe e = equipeRepository.findById(req.getEquipeId())
                .orElseThrow(() -> new EntityNotFoundException("Equipe introuvable"));

        if (req.getNumero() != null) {
            boolean numberTaken = j.getId() == null
                    ? repository.existsByEquipeIdAndNumero(req.getEquipeId(), req.getNumero())
                    : repository.existsByEquipeIdAndNumeroAndIdNot(req.getEquipeId(), req.getNumero(), j.getId());
            if (numberTaken) {
                throw new IllegalArgumentException("Ce numero est deja utilise dans cette equipe");
            }
        }

        j.setNom(clean(req.getNom()));
        j.setPrenom(clean(req.getPrenom()));
        j.setNumero(req.getNumero());
        j.setPoste(req.getPoste());
        j.setDateNaissance(req.getDateNaissance());
        j.setNationalite(req.getNationalite() == null ? null : clean(req.getNationalite()).toUpperCase(Locale.ROOT));
        if (req.getPhotoUrl() != null) j.setPhotoUrl(req.getPhotoUrl());
        if (req.getButs() != null) j.setButs(req.getButs());
        if (req.getPassesDecisives() != null) j.setPassesDecisives(req.getPassesDecisives());
        if (req.getCartonsJaunes() != null) j.setCartonsJaunes(req.getCartonsJaunes());
        if (req.getCartonsRouges() != null) j.setCartonsRouges(req.getCartonsRouges());
        if (req.getMatchsJoues() != null) j.setMatchsJoues(req.getMatchsJoues());
        j.setEquipe(e);
    }

    private String clean(String value) {
        return value == null ? null : value.trim();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @lombok.Data
    public static class JoueurRequest {
        @NotBlank
        private String nom;
        @NotBlank
        private String prenom;
        @Min(1)
        @Max(99)
        private Integer numero;
        private Joueur.Poste poste;
        private LocalDate dateNaissance;
        @Size(max = 3)
        private String nationalite;
        private String photoUrl;
        @PositiveOrZero
        private Integer buts;
        @PositiveOrZero
        private Integer passesDecisives;
        @PositiveOrZero
        private Integer cartonsJaunes;
        @PositiveOrZero
        private Integer cartonsRouges;
        @PositiveOrZero
        private Integer matchsJoues;
        @NotNull
        private Long equipeId;
    }
}
