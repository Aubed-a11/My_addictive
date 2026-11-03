package bj.myaddictive.live.domain;

import jakarta.persistence.*;

/** Abonnement a une emission (section 6.4) : notification a la sortie d'un nouvel episode. */
@Entity
@Table(name = "abonnement_podcast", uniqueConstraints = @UniqueConstraint(columnNames = {"utilisateur_id", "podcast_id"}))
public class AbonnementPodcast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;

    @Column(name = "podcast_id", nullable = false)
    private Long podcastId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
    public Long getPodcastId() { return podcastId; }
    public void setPodcastId(Long podcastId) { this.podcastId = podcastId; }
}
