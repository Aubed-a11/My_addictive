package bj.myaddictive.votes.repository;

import bj.myaddictive.votes.domain.Portefeuille;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PortefeuilleRepository extends JpaRepository<Portefeuille, Long> {
    Optional<Portefeuille> findByUtilisateurId(Long utilisateurId);

    /** Verrou en ecriture : deux votes (ou un vote et un credit) simultanes ne peuvent plus depenser la meme piece. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Portefeuille p where p.utilisateurId = :utilisateurId")
    Optional<Portefeuille> findByUtilisateurIdForUpdate(@Param("utilisateurId") Long utilisateurId);
}
