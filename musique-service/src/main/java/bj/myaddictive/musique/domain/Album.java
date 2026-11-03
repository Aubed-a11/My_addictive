package bj.myaddictive.musique.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "album")
public class Album {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false)
    private String artiste;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(length = 30)
    private String genre;

    @Column(name = "date_sortie")
    private String dateSortie;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public String getArtiste() { return artiste; }
    public void setArtiste(String artiste) { this.artiste = artiste; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getGenre() { return genre; }
    public void setGenre(String genre) { this.genre = genre; }
    public String getDateSortie() { return dateSortie; }
    public void setDateSortie(String dateSortie) { this.dateSortie = dateSortie; }
}
