package bj.myaddictive.live.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "evenement")
public class Evenement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(name = "lieu")
    private String lieu;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "chaine_id")
    private Long chaineId;

    /** Utilisateur ayant cree cet evenement (auto-service organisateur, section 6.1) ; null pour les evenements crees par le back-office admin sans compte associe. */
    @Column(name = "utilisateur_createur_id")
    private Long utilisateurCreateurId;

    @Column(name = "date_debut", nullable = false)
    private Instant dateDebut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private StatutEvenement statut = StatutEvenement.A_VENIR;

    @Column(nullable = false)
    private boolean payant = true;

    @Column(name = "prix_standard_fcfa")
    private Long prixStandardFcfa;

    @Column(name = "prix_vip_fcfa")
    private Long prixVipFcfa;

    @Column(name = "url_flux")
    private String urlFlux;

    @Column(name = "url_replay")
    private String urlReplay;

    @Column(name = "replay_disponible_jusqua")
    private Instant replayDisponibleJusqua;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public String getLieu() { return lieu; }
    public void setLieu(String lieu) { this.lieu = lieu; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Long getChaineId() { return chaineId; }
    public void setChaineId(Long chaineId) { this.chaineId = chaineId; }
    public Long getUtilisateurCreateurId() { return utilisateurCreateurId; }
    public void setUtilisateurCreateurId(Long utilisateurCreateurId) { this.utilisateurCreateurId = utilisateurCreateurId; }
    public Instant getDateDebut() { return dateDebut; }
    public void setDateDebut(Instant dateDebut) { this.dateDebut = dateDebut; }
    public StatutEvenement getStatut() { return statut; }
    public void setStatut(StatutEvenement statut) { this.statut = statut; }
    public boolean isPayant() { return payant; }
    public void setPayant(boolean payant) { this.payant = payant; }
    public Long getPrixStandardFcfa() { return prixStandardFcfa; }
    public void setPrixStandardFcfa(Long prixStandardFcfa) { this.prixStandardFcfa = prixStandardFcfa; }
    public Long getPrixVipFcfa() { return prixVipFcfa; }
    public void setPrixVipFcfa(Long prixVipFcfa) { this.prixVipFcfa = prixVipFcfa; }
    public String getUrlFlux() { return urlFlux; }
    public void setUrlFlux(String urlFlux) { this.urlFlux = urlFlux; }
    public String getUrlReplay() { return urlReplay; }
    public void setUrlReplay(String urlReplay) { this.urlReplay = urlReplay; }
    public Instant getReplayDisponibleJusqua() { return replayDisponibleJusqua; }
    public void setReplayDisponibleJusqua(Instant replayDisponibleJusqua) { this.replayDisponibleJusqua = replayDisponibleJusqua; }
}
