package bj.myaddictive.paiement.repository;

import bj.myaddictive.paiement.domain.MoyenPaiement;
import bj.myaddictive.paiement.domain.StatutTransaction;
import bj.myaddictive.paiement.domain.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUtilisateurIdOrderByDateCreationDesc(Long utilisateurId);
    Optional<Transaction> findByIdTransactionExterne(String idTransactionExterne);
    List<Transaction> findByStatutAndMoyenPaiement(StatutTransaction statut, MoyenPaiement moyenPaiement);
}
