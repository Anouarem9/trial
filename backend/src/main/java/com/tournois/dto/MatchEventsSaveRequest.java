package com.tournois.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class MatchEventsSaveRequest {
    private List<MatchEventUpdate> events = new ArrayList<>();
    private List<Long> playedPlayerIds = new ArrayList<>();
}
