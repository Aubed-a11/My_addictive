package bj.myaddictive.votes.repository;

import bj.myaddictive.votes.domain.Candidat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CandidatRepository extends JpaRepository<Candidat, Long> {
    List<Candidat> findByCompetitionId(Long competitionId);
}
