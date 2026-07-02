package com.tournois.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "match_player_stats")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchPlayerStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "match_id", nullable = false)
    @JsonIgnore
    private Matche match;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "joueur_id", nullable = false)
    private Joueur joueur;

    @Column(nullable = false)
    private Integer buts = 0;

    @Column(nullable = false)
    private Integer passesDecisives = 0;

    @Column(nullable = false)
    private Integer cartonsJaunes = 0;

    @Column(nullable = false)
    private Integer cartonsRouges = 0;
}

