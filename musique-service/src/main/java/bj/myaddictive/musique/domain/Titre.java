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
}
