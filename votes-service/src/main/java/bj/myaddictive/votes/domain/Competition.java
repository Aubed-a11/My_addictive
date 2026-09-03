package bj.myaddictive.votes.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "competition")
public class Competition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false, length = 40)
    private String categorie = "MUSIQUE"; // MUSIQUE, ENTREPRENEURIAT, TECH, DANSE, MODE, AUTRE

    @Column(nullable = false)
    private String saison;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private PhaseCompetition phase = PhaseCompetition.INSCRIPTIONS;

    @Column(name = "date_fin_phase")
    private Instant dateFinPhase;

    @Column(name = "ponderation_public")
    private Double ponderationPublic = 0.5;

    @Column(name = "ponderation_jury")
    private Double ponderationJury = 0.5;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getCategorie() { return categorie; }
    public void setCategorie(String categorie) { this.categorie = categorie; }
    public String getSaison() { return saison; }
    public void setSaison(String saison) { this.saison = saison; }
    public PhaseCompetition getPhase() { return phase; }
    public void setPhase(PhaseCompetition phase) { this.phase = phase; }
    public Instant getDateFinPhase() { return dateFinPhase; }
    public void setDateFinPhase(Instant dateFinPhase) { this.dateFinPhase = dateFinPhase; }
    public Double getPonderationPublic() { return ponderationPublic; }
    public void setPonderationPublic(Double ponderationPublic) { this.ponderationPublic = ponderationPublic; }
    public Double getPonderationJury() { return ponderationJury; }
    public void setPonderationJury(Double ponderationJury) { this.ponderationJury = ponderationJury; }
}
