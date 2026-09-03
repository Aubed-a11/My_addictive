package bj.myaddictive.live.domain;

import jakarta.persistence.*;
import java.time.Instant;

/** Cree uniquement apres confirmation du paiement. Le code QR est une chaine unique verifiee au scan. */
@Entity
@Table(name = "billet")
public class Billet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "evenement_id", nullable = false)
    private Long evenementId;

    @Column(name = "utilisateur_id")
    private Long utilisateurId; // peut etre nul pour un achat invite

    @Column(name = "telephone_invite")
    private String telephoneInvite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private CategorieBillet categorie = CategorieBillet.STANDARD;

    @Column(name = "code_qr", nullable = false, unique = true)
    private String codeQr;

    @Column(name = "transaction_id", nullable = false)
    private Long transactionId;

    @Column(nullable = false, length = 10)
    private String statut = "VALIDE"; // VALIDE, UTILISE, ANNULE

    @Column(name = "date_achat", nullable = false)
    private Instant dateAchat = Instant.now();

    @Column(name = "date_scan")
    private Instant dateScan;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEvenementId() { return evenementId; }
    public void setEvenementId(Long evenementId) { this.evenementId = evenementId; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
    public String getTelephoneInvite() { return telephoneInvite; }
    public void setTelephoneInvite(String telephoneInvite) { this.telephoneInvite = telephoneInvite; }
    public CategorieBillet getCategorie() { return categorie; }
    public void setCategorie(CategorieBillet categorie) { this.categorie = categorie; }
    public String getCodeQr() { return codeQr; }
    public void setCodeQr(String codeQr) { this.codeQr = codeQr; }
    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }
    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }
    public Instant getDateAchat() { return dateAchat; }
    public void setDateAchat(Instant dateAchat) { this.dateAchat = dateAchat; }
    public Instant getDateScan() { return dateScan; }
    public void setDateScan(Instant dateScan) { this.dateScan = dateScan; }
}
