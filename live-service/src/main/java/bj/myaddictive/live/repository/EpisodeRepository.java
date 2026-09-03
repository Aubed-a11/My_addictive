package bj.myaddictive.live.repository;

import bj.myaddictive.live.domain.Episode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EpisodeRepository extends JpaRepository<Episode, Long> {
    List<Episode> findByPodcastIdOrderByNumeroSaisonDescNumeroEpisodeDesc(Long podcastId);
}
