package com.tournois.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Match (renamed Matche to avoid clashing with the SQL reserved word MATCH).
 */
@Entity
@Table(name = "matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Matche {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tournoi_id", nullable = false)
    private Tournoi tournoi;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "equipe1_id")
    private Equipe equipe1;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "equipe2_id")
    private Equipe equipe2;

    private Integer scoreEquipe1;
    private Integer scoreEquipe2;

    private LocalDateTime dateMatch;

    private String lieu;

    /** Round index: 1 = first round, 2 = second round (final = highest round). */
    @Column(nullable = false)
    private Integer round;

    /** Position within the round (0..N-1) to lay out the bracket. */
    @Column(nullable = false)
    private Integer position;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutMatch statut = StatutMatch.A_VENIR;

    public enum StatutMatch {
        A_VENIR, EN_COURS, TERMINE
    }
}
