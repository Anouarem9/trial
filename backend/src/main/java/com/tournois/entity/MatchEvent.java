package com.tournois.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "match_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchEvent {

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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assist_joueur_id")
    private Joueur assistJoueur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Type type;

    @Column(nullable = false)
    private Integer minute = 0;

    public enum Type {
        BUT, CARTON_JAUNE, CARTON_ROUGE
    }
}
