package bj.myaddictive.votes.repository;

import bj.myaddictive.votes.domain.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    List<Vote> findByUtilisateurIdOrderByDateVoteDesc(Long utilisateurId);

    /**
     * Nombre reel de votes par candidat pour une competition, calcule
     * directement depuis les enregistrements persistes (source de verite).
     * Sert a reconstruire le cache memoire du classement (ClassementService)
     * apres un redemarrage du service, le cache lui-meme etant volatile.
     */
    @Query("SELECT v.candidatId, COUNT(v) FROM Vote v WHERE v.competitionId = :competitionId GROUP BY v.candidatId")
    List<Object[]> compterVotesParCandidat(Long competitionId);
}
