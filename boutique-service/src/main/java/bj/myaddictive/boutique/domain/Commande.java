package bj.myaddictive.boutique.domain;

import jakarta.persistence.*;
import java.time.Instant;

/** Un panier valide peut regrouper plusieurs vendeurs ; la repartition se fait via les LigneCommande. */
@Entity
@Table(name = "commande")
public class Commande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;

    @Column(name = "montant_total_fcfa", nullable = false)
    private Long montantTotalFcfa;

    @Column(name = "adresse_livraison", length = 500)
    private String adresseLivraison;

    @Column(name = "frais_livraison_fcfa")
    private Long fraisLivraisonFcfa = 0L;

    public String getAdresseLivraison() { return adresseLivraison; }
    public void setAdresseLivraison(String adresseLivraison) { this.adresseLivraison = adresseLivraison; }
    public Long getFraisLivraisonFcfa() { return fraisLivraisonFcfa; }
    public void setFraisLivraisonFcfa(Long fraisLivraisonFcfa) { this.fraisLivraisonFcfa = fraisLivraisonFcfa; }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private StatutCommande statut = StatutCommande.EN_ATTENTE;

    @Column(name = "transaction_id")
    private Long transactionId;

    @Column(name = "date_commande", nullable = false)
    private Instant dateCommande = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
    public Long getMontantTotalFcfa() { return montantTotalFcfa; }
    public void setMontantTotalFcfa(Long montantTotalFcfa) { this.montantTotalFcfa = montantTotalFcfa; }
    public StatutCommande getStatut() { return statut; }
    public void setStatut(StatutCommande statut) { this.statut = statut; }
    public Long getTransactionId() { return transactionId; }
    public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }
    public Instant getDateCommande() { return dateCommande; }
    public void setDateCommande(Instant dateCommande) { this.dateCommande = dateCommande; }
}
