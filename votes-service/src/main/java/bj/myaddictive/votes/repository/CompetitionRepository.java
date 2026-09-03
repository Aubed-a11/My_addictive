package bj.myaddictive.votes.repository;

import bj.myaddictive.votes.domain.Competition;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompetitionRepository extends JpaRepository<Competition, Long> {
    Page<Competition> findAll(Pageable pageable);
}
