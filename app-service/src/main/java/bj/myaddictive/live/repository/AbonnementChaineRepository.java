package bj.myaddictive.live.repository;

import bj.myaddictive.live.domain.AbonnementChaine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AbonnementChaineRepository extends JpaRepository<AbonnementChaine, Long> {
    List<AbonnementChaine> findByUtilisateurId(Long utilisateurId);
    Optional<AbonnementChaine> findByUtilisateurIdAndChaineId(Long utilisateurId, Long chaineId);
}
