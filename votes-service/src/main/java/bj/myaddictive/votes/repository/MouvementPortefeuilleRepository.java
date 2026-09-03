package bj.myaddictive.votes.repository;

import bj.myaddictive.votes.domain.MouvementPortefeuille;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MouvementPortefeuilleRepository extends JpaRepository<MouvementPortefeuille, Long> {
    List<MouvementPortefeuille> findByUtilisateurIdOrderByDateMouvementDesc(Long utilisateurId);
}
