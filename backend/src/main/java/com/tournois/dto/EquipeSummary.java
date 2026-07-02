package com.tournois.dto;

import com.tournois.entity.Equipe;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EquipeSummary {
    private Long id;
    private String nom;
    private String ville;
    private String logoUrl;

    public static EquipeSummary from(Equipe e) {
        if (e == null) return null;
        return new EquipeSummary(e.getId(), e.getNom(), e.getVille(), e.getLogoUrl());
    }
}
