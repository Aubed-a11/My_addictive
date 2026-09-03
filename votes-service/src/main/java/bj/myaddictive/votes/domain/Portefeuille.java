package bj.myaddictive.votes.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "portefeuille")
public class Portefeuille {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false, unique = true)
    private Long utilisateurId;

    @Column(nullable = false)
    private Long solde = 0L;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
    public Long getSolde() { return solde; }
    public void setSolde(Long solde) { this.solde = solde; }
}
