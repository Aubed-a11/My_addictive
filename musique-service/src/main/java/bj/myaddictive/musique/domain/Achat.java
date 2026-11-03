package bj.myaddictive.musique.domain;

import jakarta.persistence.*;
import java.time.Instant;

/** Cree uniquement apres confirmation du paiement (evenement RabbitMQ paiement.confirme.titre). */
@Entity
@Table(name = "achat")
public class Achat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;

    @Column(name = "titre_id", nullable = false)
    private Long titreId;

    @Column(name = "transaction_id", nullable = false)
    private Long transactionId;

    @Column(name = "date_achat", nullable = false)
    private Instant dateAchat = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
    public Long getTitreId() { return titreId; }
    public void setTitreId(Long titreId) { this.titreId = titreId; }
    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }
    public Instant getDateAchat() { return dateAchat; }
    public void setDateAchat(Instant dateAchat) { this.dateAchat = dateAchat; }
}
