package bj.myaddictive.boutique.repository;

import bj.myaddictive.boutique.domain.Produit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ProduitRepository extends JpaRepository<Produit, Long> {
    Page<Produit> findByCategorie(String categorie, Pageable pageable);
    Page<Produit> findByVendeurId(Long vendeurId, Pageable pageable);
    Page<Produit> findByDropLimiteTrueOrderByDateDebutDropAsc(Pageable pageable);

    @Modifying
    @Query("UPDATE Produit p SET p.stock = p.stock - :quantite WHERE p.id = :id AND p.stock >= :quantite")
    int decrementerStockSiSuffisant(Long id, int quantite);

    @Modifying
    @Query("UPDATE Produit p SET p.stock = p.stock + :quantite WHERE p.id = :id")
    void restaurerStock(Long id, int quantite);
}
