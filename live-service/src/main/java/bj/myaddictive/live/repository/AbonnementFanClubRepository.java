package bj.myaddictive.live.repository;

import bj.myaddictive.live.domain.AbonnementFanClub;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AbonnementFanClubRepository extends JpaRepository<AbonnementFanClub, Long> {
    Optional<AbonnementFanClub> findByUtilisateurIdAndChaineId(Long utilisateurId, Long chaineId);
}
