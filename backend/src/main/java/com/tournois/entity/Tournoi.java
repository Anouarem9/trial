package com.tournois.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tournois")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tournoi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String nom;

    private String lieu;

    @NotNull
    private LocalDate dateDebut;

    private LocalDate dateFin;

    /** Must be a power of two for single elimination (2, 4, 8, 16, 32). */
    @Column(nullable = false)
    private Integer nombreEquipes = 8;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutTournoi statut = StatutTournoi.A_VENIR;

    private String description;

    /** Teams registered to this tournament (independent of the team's life cycle). */
    @ManyToMany
    @JoinTable(
        name = "tournoi_equipes",
        joinColumns = @JoinColumn(name = "tournoi_id"),
        inverseJoinColumns = @JoinColumn(name = "equipe_id")
    )
    @JsonIgnore
    private List<Equipe> equipes = new ArrayList<>();

    @OneToMany(mappedBy = "tournoi", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Matche> matches = new ArrayList<>();

    public enum StatutTournoi {
        A_VENIR, EN_COURS, TERMINE
    }
}
