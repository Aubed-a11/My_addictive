package bj.myaddictive.compte.dto;

import bj.myaddictive.compte.domain.RoleUtilisateur;
import bj.myaddictive.compte.domain.Utilisateur;

public record UtilisateurResponse(
        Long id, String email, String nomComplet, String photoUrl, RoleUtilisateur role
) {
    public static UtilisateurResponse fromEntity(Utilisateur u) {
        return new UtilisateurResponse(u.getId(), u.getEmail(), u.getNomComplet(), u.getPhotoUrl(), u.getRole());
    }
}
