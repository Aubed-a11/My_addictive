package bj.myaddictive.boutique.repository;

import bj.myaddictive.boutique.domain.Produit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProduitRepository extends JpaRepository<Produit, Long> {
    Page<Produit> findByCategorie(String categorie, Pageable pageable);
    Page<Produit> findByVendeurId(Long vendeurId, Pageable pageable);
    Page<Produit> findByDropLimiteTrueOrderByDateDebutDropAsc(Pageable pageable);
}
