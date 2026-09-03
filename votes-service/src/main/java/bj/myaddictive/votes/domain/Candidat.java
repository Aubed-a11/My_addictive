package bj.myaddictive.votes.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "candidat")
public class Candidat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "competition_id", nullable = false)
    private Long competitionId;

    @Column(nullable = false)
    private String nom;

    @Column(name = "photo_url")
    private String photoUrl;

    @Column(name = "video_url")
    private String videoUrl;

    @Column(nullable = false)
    private String ville;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private StatutCandidat statut = StatutCandidat.EN_LICE;

    @Column(name = "note_jury")
    private Double noteJury = 0.0;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCompetitionId() { return competitionId; }
    public void setCompetitionId(Long competitionId) { this.competitionId = competitionId; }
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }
    public String getVille() { return ville; }
    public void setVille(String ville) { this.ville = ville; }
    public StatutCandidat getStatut() { return statut; }
    public void setStatut(StatutCandidat statut) { this.statut = statut; }
    public Double getNoteJury() { return noteJury; }
    public void setNoteJury(Double noteJury) { this.noteJury = noteJury; }
}
