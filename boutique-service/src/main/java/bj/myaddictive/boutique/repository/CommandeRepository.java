package bj.myaddictive.boutique.repository;

import bj.myaddictive.boutique.domain.Commande;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommandeRepository extends JpaRepository<Commande, Long> {
    List<Commande> findByUtilisateurIdOrderByDateCommandeDesc(Long utilisateurId);
}
