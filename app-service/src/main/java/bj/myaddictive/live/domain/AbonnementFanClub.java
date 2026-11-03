package bj.myaddictive.live.domain;

import jakarta.persistence.*;
import java.time.Instant;

/** Fan club ou abonnement mensuel a un artiste : acces anticipe, contenu exclusif (section 9.2). */
@Entity
@Table(name = "live_abonnement_fan_club", uniqueConstraints = @UniqueConstraint(columnNames = {"utilisateur_id", "chaine_id"}))
public class AbonnementFanClub {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;

    @Column(name = "chaine_id", nullable = false)
    private Long chaineId;

    @Column(name = "date_expiration", nullable = false)
    private Instant dateExpiration;

    /** Derniere transaction de paiement appliquee (idempotence : une notification rejouee ne prolonge pas deux fois). */
    @Column(name = "derniere_transaction_id")
    private Long derniereTransactionId;

    public Long getDerniereTransactionId() { return derniereTransactionId; }
    public void setDerniereTransactionId(Long derniereTransactionId) { this.derniereTransactionId = derniereTransactionId; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
    public Long getChaineId() { return chaineId; }
    public void setChaineId(Long chaineId) { this.chaineId = chaineId; }
    public Instant getDateExpiration() { return dateExpiration; }
    public void setDateExpiration(Instant dateExpiration) { this.dateExpiration = dateExpiration; }
}
