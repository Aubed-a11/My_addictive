package bj.myaddictive.compte.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "utilisateur")
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Conserves pour les comptes issus de l'ancien site (import legacy), mais
    // plus utilises pour l'authentification : email + mot de passe uniquement.
    @Column(name = "indicatif_pays", length = 5)
    private String indicatifPays;

    @Column(length = 20)
    private String telephone;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "nom_complet")
    private String nomComplet;

    @Column(name = "mot_de_passe_hash")
    private String motDePasseHash;

    @Column(name = "photo_url")
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoleUtilisateur role = RoleUtilisateur.MEMBRE;

    @Column(name = "telephone_verifie", nullable = false)
    private boolean telephoneVerifie = false;

    @Column(name = "actif", nullable = false)
    private boolean actif = true;

    @Column(name = "date_creation", nullable = false)
    private Instant dateCreation = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getIndicatifPays() { return indicatifPays; }
    public void setIndicatifPays(String indicatifPays) { this.indicatifPays = indicatifPays; }
    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getNomComplet() { return nomComplet; }
    public void setNomComplet(String nomComplet) { this.nomComplet = nomComplet; }
    public String getMotDePasseHash() { return motDePasseHash; }
    public void setMotDePasseHash(String motDePasseHash) { this.motDePasseHash = motDePasseHash; }
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    public RoleUtilisateur getRole() { return role; }
    public void setRole(RoleUtilisateur role) { this.role = role; }
    public boolean isTelephoneVerifie() { return telephoneVerifie; }
    public void setTelephoneVerifie(boolean telephoneVerifie) { this.telephoneVerifie = telephoneVerifie; }
    public boolean isActif() { return actif; }
    public void setActif(boolean actif) { this.actif = actif; }
    public Instant getDateCreation() { return dateCreation; }
    public void setDateCreation(Instant dateCreation) { this.dateCreation = dateCreation; }
}
