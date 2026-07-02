package com.tournois.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "joueurs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Joueur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String nom;

    @NotBlank
    private String prenom;

    private Integer numero;

    @Enumerated(EnumType.STRING)
    private Poste poste;

    private LocalDate dateNaissance;

    private String nationalite;

    private String photoUrl;

    /** Aggregate stats across all tournaments. */
    @Column(nullable = false)
    private Integer buts = 0;

    @Column(nullable = false)
    private Integer passesDecisives = 0;

    @Column(nullable = false)
    private Integer cartonsJaunes = 0;

    @Column(nullable = false)
    private Integer cartonsRouges = 0;

    @Column(nullable = false)
    private Integer matchsJoues = 0;


    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "equipe_id")
    private Equipe equipe;

    public enum Poste {
        GARDIEN, DEFENSEUR, MILIEU, ATTAQUANT
    }
}
