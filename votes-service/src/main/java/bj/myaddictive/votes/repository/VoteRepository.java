package bj.myaddictive.votes.repository;

import bj.myaddictive.votes.domain.Vote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    List<Vote> findByUtilisateurIdOrderByDateVoteDesc(Long utilisateurId);
}
