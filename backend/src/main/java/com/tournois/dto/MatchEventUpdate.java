package com.tournois.dto;

import com.tournois.entity.MatchEvent;
import lombok.Data;

@Data
public class MatchEventUpdate {
    private MatchEvent.Type type;
    private Long joueurId;
    private Long assistJoueurId;
    private Integer minute;
}
