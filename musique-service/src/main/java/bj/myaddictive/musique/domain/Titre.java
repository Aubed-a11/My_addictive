package bj.myaddictive.musique.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "titre")
public class Titre {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String artiste;

    @Column(length = 30)
    private String genre;

    @Column(name = "album_id")
    private Long albumId;

    @Column(name = "fichier_audio_url", nullable = false)
    private String fichierAudioUrl;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "duree_secondes")
    private Integer dureeSecondes;

    @Column(nullable = false)
    private boolean gratuit = true;

    @Column(name = "prix_fcfa")
    private Long prixFcfa = 0L;

    @Column(name = "compteur_ecoutes", nullable = false)
    private Long compteurEcoutes = 0L;

    @Column(name = "compteur_telechargements", nullable = false)
    private Long compteurTelechargements = 0L;

    @Column(name = "youtube_url")
    private String youtubeUrl; // clip officiel, pour la section "Brand New" (accueil Musique)

    @Column(name = "date_ajout")
    private java.time.Instant dateAjout = java.time.Instant.now(); // sert a trier les nouveautes par ordre chronologique reel, pas par id (peu fiable sur des donnees importees en masse)

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getArtiste() { return artiste; }
    public void setArtiste(String artiste) { this.artiste = artiste; }
    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }
    public Long getAlbumId() { return albumId; }
    public void setAlbumId(Long albumId) { this.albumId = albumId; }
    public String getFichierAudioUrl() { return fichierAudioUrl; }
    public void setFichierAudioUrl(String fichierAudioUrl) { this.fichierAudioUrl = fichierAudioUrl; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Integer getDureeSecondes() { return dureeSecondes; }
    public void setDureeSecondes(Integer dureeSecondes) { this.dureeSecondes = dureeSecondes; }
    public boolean isGratuit() { return gratuit; }
    public void setGratuit(boolean gratuit) { this.gratuit = gratuit; }
    public Long getPrixFcfa() { return prixFcfa; }
    public void setPrixFcfa(Long prixFcfa) { this.prixFcfa = prixFcfa; }
    public Long getCompteurEcoutes() { return compteurEcoutes; }
    public void setCompteurEcoutes(Long compteurEcoutes) { this.compteurEcoutes = compteurEcoutes; }
    public Long getCompteurTelechargements() { return compteurTelechargements; }
    public void setCompteurTelechargements(Long compteurTelechargements) { this.compteurTelechargements = compteurTelechargements; }
    public String getYoutubeUrl() { return youtubeUrl; }
    public void setYoutubeUrl(String youtubeUrl) { this.youtubeUrl = youtubeUrl; }
    public java.time.Instant getDateAjout() { return dateAjout; }
    public void setDateAjout(java.time.Instant dateAjout) { this.dateAjout = dateAjout; }
}
