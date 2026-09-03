package bj.myaddictive.musique.repository;

import bj.myaddictive.musique.domain.Achat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AchatRepository extends JpaRepository<Achat, Long> {
    List<Achat> findByUtilisateurId(Long utilisateurId);
    Optional<Achat> findByUtilisateurIdAndTitreId(Long utilisateurId, Long titreId);
    boolean existsByTransactionId(Long transactionId);
}
