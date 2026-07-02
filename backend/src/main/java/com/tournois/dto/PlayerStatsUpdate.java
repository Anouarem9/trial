package com.tournois.dto;

import lombok.Data;

@Data
public class PlayerStatsUpdate {
    private Long joueurId;
    private Integer buts;
    private Integer passesDecisives;
    private Integer cartonsJaunes;
    private Integer cartonsRouges;
}
