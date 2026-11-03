package bj.myaddictive.live.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "abonnement_chaine", uniqueConstraints = @UniqueConstraint(columnNames = {"utilisateur_id", "chaine_id"}))
public class AbonnementChaine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;

    @Column(name = "chaine_id", nullable = false)
    private Long chaineId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
    public Long getChaineId() { return chaineId; }
    public void setChaineId(Long chaineId) { this.chaineId = chaineId; }
}
