package bj.myaddictive.boutique.repository;

import bj.myaddictive.boutique.domain.StatutVendeur;
import bj.myaddictive.boutique.domain.Vendeur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VendeurRepository extends JpaRepository<Vendeur, Long> {
    Page<Vendeur> findByStatut(StatutVendeur statut, Pageable pageable);
    Optional<Vendeur> findByUtilisateurId(Long utilisateurId);
}
