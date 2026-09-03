package bj.myaddictive.boutique.repository;

import bj.myaddictive.boutique.domain.PanierItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PanierItemRepository extends JpaRepository<PanierItem, Long> {
    List<PanierItem> findByUtilisateurId(Long utilisateurId);
    Optional<PanierItem> findByUtilisateurIdAndProduitId(Long utilisateurId, Long produitId);
    void deleteByUtilisateurId(Long utilisateurId);
}
