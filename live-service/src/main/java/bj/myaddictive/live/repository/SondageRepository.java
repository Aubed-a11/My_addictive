package bj.myaddictive.live.repository;

import bj.myaddictive.live.domain.Sondage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SondageRepository extends JpaRepository<Sondage, Long> {
    List<Sondage> findByEvenementIdAndActifTrue(Long evenementId);
}
