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

    /**
     * Decrement atomique et conditionnel : ne reussit (renvoie 1 ligne
     * affectee) que si le stock est encore suffisant au moment exact de
     * l'execution SQL, empechant toute survente meme si deux achats du
     * dernier exemplaire arrivent au meme instant (contrairement a un
     * "verifier puis decrementer" en deux etapes separees, vulnerable a
     * une condition de course). Reserve le stock des l'initiation de la
     * commande, pas seulement a la confirmation du paiement.
     */
    @Modifying
    @Query("UPDATE Produit p SET p.stock = p.stock - :quantite WHERE p.id = :id AND p.stock >= :quantite")
    int decrementerStockSiSuffisant(Long id, int quantite);

    @Modifying
    @Query("UPDATE Produit p SET p.stock = p.stock + :quantite WHERE p.id = :id")
    void restaurerStock(Long id, int quantite);
}
