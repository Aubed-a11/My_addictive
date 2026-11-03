package bj.myaddictive.live.repository;

import bj.myaddictive.live.domain.Billet;
import bj.myaddictive.live.domain.CategorieBillet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BilletRepository extends JpaRepository<Billet, Long> {
    List<Billet> findByUtilisateurId(Long utilisateurId);
    Optional<Billet> findByCodeQr(String codeQr);
    boolean existsByTransactionId(Long transactionId);
    /** Places deja prises pour une categorie donnee (statut different d'ANNULE : un billet annule libere sa place). */
    long countByEvenementIdAndCategorieAndStatutNot(Long evenementId, CategorieBillet categorie, String statut);
    /** Verifie qu'un utilisateur possede un billet valide (non annule) pour un evenement donne. */
    boolean existsByUtilisateurIdAndEvenementIdAndStatutNot(Long utilisateurId, Long evenementId, String statut);
}
