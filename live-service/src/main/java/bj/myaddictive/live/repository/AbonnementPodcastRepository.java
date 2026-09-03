package bj.myaddictive.live.repository;

import bj.myaddictive.live.domain.AbonnementPodcast;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AbonnementPodcastRepository extends JpaRepository<AbonnementPodcast, Long> {
    Optional<AbonnementPodcast> findByUtilisateurIdAndPodcastId(Long utilisateurId, Long podcastId);
}
