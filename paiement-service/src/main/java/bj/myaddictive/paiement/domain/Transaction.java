package bj.myaddictive.paiement.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "transaction")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;

    @Enumerated(EnumType.STRING)
    @Column(name = "moyen_paiement", nullable = false, length = 20)
    private MoyenPaiement moyenPaiement;

    @Column(nullable = false)
    private Long montantFcfa;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_objet", nullable = false, length = 20)
    private TypeObjetPaiement typeObjet;

    @Column(name = "reference_id", nullable = false)
    private String referenceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private StatutTransaction statut = StatutTransaction.EN_ATTENTE;

    @Column(name = "id_transaction_externe")
    private String idTransactionExterne;

    @Column(name = "date_creation", nullable = false)
    private Instant dateCreation = Instant.now();

    @Column(name = "date_maj")
    private Instant dateMaj;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
    public MoyenPaiement getMoyenPaiement() { return moyenPaiement; }
    public void setMoyenPaiement(MoyenPaiement moyenPaiement) { this.moyenPaiement = moyenPaiement; }
    public Long getMontantFcfa() { return montantFcfa; }
    public void setMontantFcfa(Long montantFcfa) { this.montantFcfa = montantFcfa; }
    public TypeObjetPaiement getTypeObjet() { return typeObjet; }
    public void setTypeObjet(TypeObjetPaiement typeObjet) { this.typeObjet = typeObjet; }
    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }
    public StatutTransaction getStatut() { return statut; }
    public void setStatut(StatutTransaction statut) { this.statut = statut; }
    public String getIdTransactionExterne() { return idTransactionExterne; }
    public void setIdTransactionExterne(String idTransactionExterne) { this.idTransactionExterne = idTransactionExterne; }
    public Instant getDateCreation() { return dateCreation; }
    public void setDateCreation(Instant dateCreation) { this.dateCreation = dateCreation; }
    public Instant getDateMaj() { return dateMaj; }
    public void setDateMaj(Instant dateMaj) { this.dateMaj = dateMaj; }
}
