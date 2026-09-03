package bj.myaddictive.live.domain;

import jakarta.persistence.*;

/** Un seul vote par utilisateur et par sondage (contrainte d'unicite). */
@Entity
@Table(name = "sondage_vote", uniqueConstraints = @UniqueConstraint(columnNames = {"sondage_id", "utilisateur_id"}))
public class SondageVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sondage_id", nullable = false)
    private Long sondageId;

    @Column(name = "option_id", nullable = false)
    private Long optionId;

    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getSondageId() { return sondageId; }
    public void setSondageId(Long sondageId) { this.sondageId = sondageId; }
    public Long getOptionId() { return optionId; }
    public void setOptionId(Long optionId) { this.optionId = optionId; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
}
