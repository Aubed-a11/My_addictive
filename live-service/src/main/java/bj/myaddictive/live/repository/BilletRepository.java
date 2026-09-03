package bj.myaddictive.live.repository;

import bj.myaddictive.live.domain.Billet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BilletRepository extends JpaRepository<Billet, Long> {
    List<Billet> findByUtilisateurId(Long utilisateurId);
    Optional<Billet> findByCodeQr(String codeQr);
    boolean existsByTransactionId(Long transactionId);
}
