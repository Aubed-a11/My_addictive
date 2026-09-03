package bj.myaddictive.compte.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "favori", uniqueConstraints = @UniqueConstraint(columnNames = {"utilisateur_id", "type_cible", "reference_id"}))
public class Favori {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;

    @Column(name = "type_cible", nullable = false, length = 30)
    private String typeCible;

    @Column(name = "reference_id", nullable = false)
    private String referenceId;

    @Column(name = "date_ajout", nullable = false)
    private Instant dateAjout = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
    public String getTypeCible() { return typeCible; }
    public void setTypeCible(String typeCible) { this.typeCible = typeCible; }
    public String getReferenceId() { return referenceId; }
    public void setReferenceId(String referenceId) { this.referenceId = referenceId; }
    public Instant getDateAjout() { return dateAjout; }
    public void setDateAjout(Instant dateAjout) { this.dateAjout = dateAjout; }
}
