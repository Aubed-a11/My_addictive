package bj.myaddictive.votes.repository;

import bj.myaddictive.votes.domain.Portefeuille;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PortefeuilleRepository extends JpaRepository<Portefeuille, Long> {
    Optional<Portefeuille> findByUtilisateurId(Long utilisateurId);
}
