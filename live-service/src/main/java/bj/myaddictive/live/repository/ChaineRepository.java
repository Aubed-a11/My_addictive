package bj.myaddictive.live.repository;

import bj.myaddictive.live.domain.Chaine;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChaineRepository extends JpaRepository<Chaine, Long> {
    Page<Chaine> findAll(Pageable pageable);
    java.util.List<Chaine> findByImageUrlIsNull();
}
