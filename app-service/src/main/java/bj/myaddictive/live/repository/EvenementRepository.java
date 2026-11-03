package bj.myaddictive.live.repository;

import bj.myaddictive.live.domain.Evenement;
import bj.myaddictive.live.domain.StatutEvenement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EvenementRepository extends JpaRepository<Evenement, Long> {
    Page<Evenement> findByStatut(StatutEvenement statut, Pageable pageable);
    Page<Evenement> findByChaineId(Long chaineId, Pageable pageable);
    java.util.List<Evenement> findByUtilisateurCreateurId(Long utilisateurCreateurId);
}
