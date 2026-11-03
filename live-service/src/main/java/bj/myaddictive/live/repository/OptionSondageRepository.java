package bj.myaddictive.live.repository;

import bj.myaddictive.live.domain.OptionSondage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OptionSondageRepository extends JpaRepository<OptionSondage, Long> {
    List<OptionSondage> findBySondageId(Long sondageId);
}
