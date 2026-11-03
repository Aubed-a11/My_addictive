package bj.myaddictive.paiement.repository;

import bj.myaddictive.paiement.domain.MoyenPaiement;
import bj.myaddictive.paiement.domain.StatutTransaction;
import bj.myaddictive.paiement.domain.Transaction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUtilisateurIdOrderByDateCreationDesc(Long utilisateurId);
    Optional<Transaction> findByIdTransactionExterne(String idTransactionExterne);
    List<Transaction> findByNotificationEnAttenteTrue();

    /** Transaction KKiaPay en attente, creee recemment, pour le meme objet : reutilisee en cas de double clic / nouvelle tentative. */
    Optional<Transaction> findFirstByUtilisateurIdAndMoyenPaiementAndTypeObjetAndReferenceIdAndStatutAndIdTransactionExterneIsNullAndDateCreationAfterOrderByDateCreationDesc(
            Long utilisateurId, MoyenPaiement moyenPaiement, bj.myaddictive.paiement.domain.TypeObjetPaiement typeObjet,
            String referenceId, StatutTransaction statut, java.time.Instant apres);
    List<Transaction> findByStatutAndMoyenPaiement(StatutTransaction statut, MoyenPaiement moyenPaiement);

    /** Verrou en ecriture : empeche deux confirmations simultanees (webhook, liaison, relance) de notifier deux fois le service metier. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Transaction t where t.id = :id")
    Optional<Transaction> findByIdForUpdate(@Param("id") Long id);
}
