package com.tournois.dto;

import com.tournois.entity.Matche;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatcheDTO {
    private Long id;
    private Long tournoiId;
    private EquipeSummary equipe1;
    private EquipeSummary equipe2;
    private Integer scoreEquipe1;
    private Integer scoreEquipe2;
    private LocalDateTime dateMatch;
    private String lieu;
    private Integer round;
    private Integer position;
    private Matche.StatutMatch statut;

    public static MatcheDTO from(Matche m) {
        return new MatcheDTO(
                m.getId(),
                m.getTournoi() != null ? m.getTournoi().getId() : null,
                EquipeSummary.from(m.getEquipe1()),
                EquipeSummary.from(m.getEquipe2()),
                m.getScoreEquipe1(),
                m.getScoreEquipe2(),
                m.getDateMatch(),
                m.getLieu(),
                m.getRound(),
                m.getPosition(),
                m.getStatut()
        );
    }
}
