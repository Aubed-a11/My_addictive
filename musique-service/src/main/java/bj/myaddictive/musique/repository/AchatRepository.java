package bj.myaddictive.musique.repository;

import bj.myaddictive.musique.domain.Achat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AchatRepository extends JpaRepository<Achat, Long> {
    List<Achat> findByUtilisateurId(Long utilisateurId);
    Optional<Achat> findByUtilisateurIdAndTitreId(Long utilisateurId, Long titreId);
    boolean existsByTransactionId(Long transactionId);

    /** Nombre reel de ventes par titre, pour un vrai "Top Vente" distinct du "Top Telechargement gratuit" (qui lui se base sur les titres gratuits uniquement). */
    @org.springframework.data.jpa.repository.Query("SELECT a.titreId, COUNT(a) as nb FROM Achat a GROUP BY a.titreId ORDER BY nb DESC")
    List<Object[]> topVentes(org.springframework.data.domain.Pageable pageable);
}
