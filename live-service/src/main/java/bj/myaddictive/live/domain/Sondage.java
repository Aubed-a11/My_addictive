package bj.myaddictive.live.domain;

import jakarta.persistence.*;
import java.time.Instant;

/** Sondage lance par l'organisateur pendant le direct (section 6.5). */
@Entity
@Table(name = "sondage")
public class Sondage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "evenement_id", nullable = false)
    private Long evenementId;

    @Column(nullable = false)
    private String question;

    @Column(nullable = false)
    private boolean actif = true;

    @Column(name = "date_creation", nullable = false)
    private Instant dateCreation = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEvenementId() { return evenementId; }
    public void setEvenementId(Long evenementId) { this.evenementId = evenementId; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public boolean isActif() { return actif; }
    public void setActif(boolean actif) { this.actif = actif; }
    public Instant getDateCreation() { return dateCreation; }
    public void setDateCreation(Instant dateCreation) { this.dateCreation = dateCreation; }
}
