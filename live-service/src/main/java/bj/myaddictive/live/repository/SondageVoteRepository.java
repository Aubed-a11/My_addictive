package bj.myaddictive.live.repository;

import bj.myaddictive.live.domain.SondageVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SondageVoteRepository extends JpaRepository<SondageVote, Long> {
    Optional<SondageVote> findBySondageIdAndUtilisateurId(Long sondageId, Long utilisateurId);
    List<SondageVote> findBySondageId(Long sondageId);
    long countBySondageIdAndOptionId(Long sondageId, Long optionId);
}
