package bj.myaddictive.compte.repository;

import bj.myaddictive.compte.domain.Favori;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriRepository extends JpaRepository<Favori, Long> {
    List<Favori> findByUtilisateurId(Long utilisateurId);
    Optional<Favori> findByUtilisateurIdAndTypeCibleAndReferenceId(Long utilisateurId, String typeCible, String referenceId);
}
