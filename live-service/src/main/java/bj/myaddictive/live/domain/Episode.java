package bj.myaddictive.live.domain;

@jakarta.persistence.Entity
@jakarta.persistence.Table(name = "episode")
public class Episode {

    @jakarta.persistence.Id
    @jakarta.persistence.GeneratedValue(strategy = jakarta.persistence.GenerationType.IDENTITY)
    private Long id;

    @jakarta.persistence.Column(name = "podcast_id", nullable = false)
    private Long podcastId;

    @jakarta.persistence.Column(nullable = false)
    private String titre;

    @jakarta.persistence.Column(name = "numero_saison")
    private Integer numeroSaison;

    @jakarta.persistence.Column(name = "numero_episode")
    private Integer numeroEpisode;

    @jakarta.persistence.Column(name = "fichier_audio_url", nullable = false)
    private String fichierAudioUrl;

    @jakarta.persistence.Column(name = "duree_secondes")
    private Integer dureeSecondes;

    @jakarta.persistence.Column(name = "evenement_lie_id")
    private Long evenementLieId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getPodcastId() { return podcastId; }
    public void setPodcastId(Long podcastId) { this.podcastId = podcastId; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public Integer getNumeroSaison() { return numeroSaison; }
    public void setNumeroSaison(Integer numeroSaison) { this.numeroSaison = numeroSaison; }
    public Integer getNumeroEpisode() { return numeroEpisode; }
    public void setNumeroEpisode(Integer numeroEpisode) { this.numeroEpisode = numeroEpisode; }
    public String getFichierAudioUrl() { return fichierAudioUrl; }
    public void setFichierAudioUrl(String fichierAudioUrl) { this.fichierAudioUrl = fichierAudioUrl; }
    public Integer getDureeSecondes() { return dureeSecondes; }
    public void setDureeSecondes(Integer dureeSecondes) { this.dureeSecondes = dureeSecondes; }
    public Long getEvenementLieId() { return evenementLieId; }
    public void setEvenementLieId(Long evenementLieId) { this.evenementLieId = evenementLieId; }
}
