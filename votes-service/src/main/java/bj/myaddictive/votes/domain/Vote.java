package bj.myaddictive.votes.domain;

import jakarta.persistence.*;
import java.time.Instant;

/** Les pieces ne sont pas remboursables : un vote enregistre ici represente une piece definitivement depensee. */
@Entity
@Table(name = "vote")
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;

    @Column(name = "candidat_id", nullable = false)
    private Long candidatId;

    @Column(name = "competition_id", nullable = false)
    private Long competitionId;

    @Column(name = "date_vote", nullable = false)
    private Instant dateVote = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUtilisateurId() { return utilisateurId; }
    public void setUtilisateurId(Long utilisateurId) { this.utilisateurId = utilisateurId; }
    public Long getCandidatId() { return candidatId; }
    public void setCandidatId(Long candidatId) { this.candidatId = candidatId; }
    public Long getCompetitionId() { return competitionId; }
    public void setCompetitionId(Long competitionId) { this.competitionId = competitionId; }
    public Instant getDateVote() { return dateVote; }
    public void setDateVote(Instant dateVote) { this.dateVote = dateVote; }
}
