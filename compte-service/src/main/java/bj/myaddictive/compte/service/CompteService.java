package bj.myaddictive.compte.service;

import bj.myaddictive.compte.domain.Favori;
import bj.myaddictive.compte.domain.Utilisateur;
import bj.myaddictive.compte.dto.ChangerMotDePasseRequest;
import bj.myaddictive.compte.dto.FavoriRequest;
import bj.myaddictive.compte.dto.MettreAJourProfilRequest;
import bj.myaddictive.compte.exception.ApiException;
import bj.myaddictive.compte.repository.FavoriRepository;
import bj.myaddictive.compte.repository.UtilisateurRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CompteService {

    private final UtilisateurRepository utilisateurRepository;
    private final FavoriRepository favoriRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public CompteService(UtilisateurRepository utilisateurRepository, FavoriRepository favoriRepository) {
        this.utilisateurRepository = utilisateurRepository;
        this.favoriRepository = favoriRepository;
    }

    public Utilisateur obtenirParId(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));
    }

    public Utilisateur mettreAJourProfil(Long id, MettreAJourProfilRequest requete) {
        Utilisateur utilisateur = obtenirParId(id);
        if (requete.nomComplet() != null) utilisateur.setNomComplet(requete.nomComplet());
        if (requete.email() != null) utilisateur.setEmail(requete.email());
        if (requete.photoUrl() != null) utilisateur.setPhotoUrl(requete.photoUrl());
        return utilisateurRepository.save(utilisateur);
    }

    /** Changement de mot de passe depuis les parametres (section 9.2), verifie l'ancien mot de passe avant de le remplacer. */
    public void changerMotDePasse(Long id, ChangerMotDePasseRequest requete) {
        Utilisateur utilisateur = obtenirParId(id);
        if (!passwordEncoder.matches(requete.ancienMotDePasse(), utilisateur.getMotDePasseHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Mot de passe actuel incorrect.");
        }
        if (requete.nouveauMotDePasse() == null || requete.nouveauMotDePasse().length() < 6) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Le nouveau mot de passe doit contenir au moins 6 caracteres.");
        }
        utilisateur.setMotDePasseHash(passwordEncoder.encode(requete.nouveauMotDePasse()));
        utilisateurRepository.save(utilisateur);
    }

    @org.springframework.beans.factory.annotation.Value("${app.uploads-path:./compte-service/uploads/}")
    private String cheminUploads;

    /**
     * Enregistre la photo de profil sur disque (dossier uploads/photos/, voir
     * ConfigurationFichiersStatiques) et met a jour l'utilisateur. Nom de
     * fichier unique (UUID) pour eviter tout ecrasement entre utilisateurs.
     */
    public Utilisateur uploaderPhoto(Long id, org.springframework.web.multipart.MultipartFile fichier) {
        if (fichier == null || fichier.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Aucun fichier recu.");
        }
        String extension = "";
        String nomOriginal = fichier.getOriginalFilename();
        if (nomOriginal != null && nomOriginal.contains(".")) {
            extension = nomOriginal.substring(nomOriginal.lastIndexOf('.'));
        }
        if (!extension.toLowerCase().matches("\\.(jpe?g|png|webp)")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Format d'image non supporte (jpg, png ou webp uniquement).");
        }

        String nomFichier = java.util.UUID.randomUUID() + extension;
        try {
            java.nio.file.Path dossier = java.nio.file.Paths.get(cheminUploads, "photos");
            java.nio.file.Files.createDirectories(dossier);
            java.nio.file.Path destination = dossier.resolve(nomFichier);
            fichier.transferTo(destination);
        } catch (java.io.IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Echec de l'enregistrement de la photo.");
        }

        Utilisateur utilisateur = obtenirParId(id);
        utilisateur.setPhotoUrl("/api/compte/fichiers/photos/" + nomFichier);
        return utilisateurRepository.save(utilisateur);
    }

    public List<Favori> listerFavoris(Long utilisateurId) {
        return favoriRepository.findByUtilisateurId(utilisateurId);
    }

    /** Vue back-office : tous les utilisateurs (pour attribuer des roles, ex. ORGANISATEUR). */
    public List<Utilisateur> listerTousUtilisateurs() {
        return utilisateurRepository.findAll();
    }

    public Utilisateur changerRole(Long id, bj.myaddictive.compte.domain.RoleUtilisateur nouveauRole) {
        Utilisateur utilisateur = obtenirParId(id);
        utilisateur.setRole(nouveauRole);
        return utilisateurRepository.save(utilisateur);
    }

    public Favori ajouterFavori(Long utilisateurId, FavoriRequest requete) {
        return favoriRepository.findByUtilisateurIdAndTypeCibleAndReferenceId(
                utilisateurId, requete.typeCible(), requete.referenceId())
                .orElseGet(() -> {
                    Favori favori = new Favori();
                    favori.setUtilisateurId(utilisateurId);
                    favori.setTypeCible(requete.typeCible());
                    favori.setReferenceId(requete.referenceId());
                    return favoriRepository.save(favori);
                });
    }

    public void retirerFavori(Long favoriId, Long utilisateurId) {
        Favori favori = favoriRepository.findById(favoriId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Favori introuvable."));
        if (!favori.getUtilisateurId().equals(utilisateurId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Ce favori n'appartient pas a cet utilisateur.");
        }
        favoriRepository.delete(favori);
    }
}
