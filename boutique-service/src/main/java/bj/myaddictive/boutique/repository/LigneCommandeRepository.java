package bj.myaddictive.boutique.repository;

import bj.myaddictive.boutique.domain.LigneCommande;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LigneCommandeRepository extends JpaRepository<LigneCommande, Long> {
    List<LigneCommande> findByCommandeId(Long commandeId);
    List<LigneCommande> findByVendeurId(Long vendeurId);
}
