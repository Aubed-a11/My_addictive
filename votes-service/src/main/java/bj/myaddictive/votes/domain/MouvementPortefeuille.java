package bj.myaddictive.votes.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Historique des mouvements du portefeuille de pieces (section 9.1, "Mon
 * Wallet") : chaque achat ou depense de piece est journalise ici, pour
 * affichage cote app (ex. "+50 Achat de pieces", "-1 Vote Talent Show").
 */
@Entity
@Table(name = "mouvement_portefeuille")
public class MouvementPortefeuille {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;

    /** Positif pour un credit (achat), negatif pour un debit (vote). */
    @Column(nullable = false)
    private Long montant;

    @Column(nullable = false)
    private String motif;

    @Column(name = "date_mouvement", nullable = false)
    private Instant dateMouvement = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
    public Long getMontant() { return montant; }
    public void setMontant(Long montant) { this.montant = montant; }
    public String getMotif() { return motif; }
    public void setMotif(String motif) { this.motif = motif; }
    public Instant getDateMouvement() { return dateMouvement; }
    public void setDateMouvement(Instant dateMouvement) { this.dateMouvement = dateMouvement; }
}
