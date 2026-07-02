package com.tournois.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * A team is an independent entity. It can be registered into many tournaments over time
 * via the {@link Tournoi#equipes} many-to-many join (table {@code tournoi_equipes}).
 */
@Entity
@Table(name = "equipes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Equipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String nom;

    private String ville;

    private String entraineur;

    private String logoUrl;

    @ManyToMany(mappedBy = "equipes")
    @JsonIgnore
    private List<Tournoi> tournois = new ArrayList<>();

    @OneToMany(mappedBy = "equipe", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Joueur> joueurs = new ArrayList<>();
}
