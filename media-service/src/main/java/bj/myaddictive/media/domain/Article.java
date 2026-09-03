package bj.myaddictive.media.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "article")
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(name = "chapo")
    private String chapo;

    @Lob
    @Column(name = "contenu")
    private String contenu;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(nullable = false, length = 30)
    private String categorie; // ACTUALITE, SHOWBIZ, VIDEO, A_LA_UNE

    @Column(name = "artiste_lie")
    private String artisteLie;

    /** Lien video (embed YouTube) pour les articles de categorie VIDEO. */
    @Column(name = "video_url")
    private String videoUrl;

    @Column(name = "compteur_vues", nullable = false)
    private Long compteurVues = 0L;

    @Column(name = "a_la_une", nullable = false)
    private boolean aLaUne = false;

    @Column(nullable = false, length = 15)
    private String statut = "PUBLIE"; // BROUILLON, PUBLIE

    @Column(name = "date_publication", nullable = false)
    private Instant datePublication = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public String getChapo() { return chapo; }
    public void setChapo(String chapo) { this.chapo = chapo; }
    public String getContenu() { return contenu; }
    public void setContenu(String contenu) { this.contenu = contenu; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }
    public String getArtisteLie() { return artisteLie; }
    public void setArtisteLie(String artisteLie) { this.artisteLie = artisteLie; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public Long getCompteurVues() { return compteurVues; }
    public void setCompteurVues(Long compteurVues) { this.compteurVues = compteurVues; }
    public boolean isALaUne() { return aLaUne; }
    public void setALaUne(boolean aLaUne) { this.aLaUne = aLaUne; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public Instant getDatePublication() { return datePublication; }
    public void setDatePublication(Instant datePublication) { this.datePublication = datePublication; }
}
