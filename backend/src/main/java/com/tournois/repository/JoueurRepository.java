package com.tournois.repository;

import com.tournois.entity.Joueur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JoueurRepository extends JpaRepository<Joueur, Long> {
    List<Joueur> findByEquipeId(Long equipeId);

    boolean existsByEquipeIdAndNumero(Long equipeId, Integer numero);

    boolean existsByEquipeIdAndNumeroAndIdNot(Long equipeId, Integer numero, Long id);
}
