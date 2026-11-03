package bj.myaddictive.musique.repository;

import bj.myaddictive.musique.domain.Ecoute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EcouteRepository extends JpaRepository<Ecoute, Long> {
    List<Ecoute> findByUtilisateurIdOrderByDateEcouteDesc(Long utilisateurId);
}
