package bj.myaddictive.musique.domain;

import jakarta.persistence.*;
import java.time.Instant;

/** Historique d'ecoute personnel (section 9.1, "Mon compte"). */
@Entity
@Table(name = "ecoute")
public class Ecoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;

    @Column(name = "titre_id", nullable = false)
    private Long titreId;

    @Column(name = "date_ecoute", nullable = false)
    private Instant dateEcoute = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
    public Long getTitreId() { return titreId; }
    public void setTitreId(Long titreId) { this.titreId = titreId; }
    public Instant getDateEcoute() { return dateEcoute; }
    public void setDateEcoute(Instant dateEcoute) { this.dateEcoute = dateEcoute; }
}
