package bj.myaddictive.live.repository;

import bj.myaddictive.live.domain.Podcast;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PodcastRepository extends JpaRepository<Podcast, Long> {
    Page<Podcast> findAll(Pageable pageable);
}
