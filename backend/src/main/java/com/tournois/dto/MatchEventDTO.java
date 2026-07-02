package com.tournois.dto;

import com.tournois.entity.Joueur;
import com.tournois.entity.MatchEvent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchEventDTO {
    private Long id;
    private Integer minute;
    private MatchEvent.Type type;
    private Joueur joueur;
    private Joueur assistJoueur;

    public static MatchEventDTO from(MatchEvent event) {
        return new MatchEventDTO(
                event.getId(),
                event.getMinute(),
                event.getType(),
                event.getJoueur(),
                event.getAssistJoueur()
        );
    }
}
