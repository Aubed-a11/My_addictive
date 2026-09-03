package bj.myaddictive.live.dto;

import bj.myaddictive.live.domain.Billet;
import bj.myaddictive.live.domain.Evenement;

import java.time.Instant;

/**
 * Billet enrichi des informations de l'evenement (titre, lieu, date), et
 * des infos de scan (date de scan si deja utilise), pour eviter un appel
 * separe cote app mobile. Sans ca, "Mes billets" ne pouvait meme pas
 * afficher a quel evenement chaque billet correspondait.
 */
public record BilletResponse(
        Long id, String categorie, String codeQr, String statut,
        Instant dateAchat, Instant dateScan,
        Long evenementId, String evenementTitre, String evenementLieu, Instant evenementDateDebut, String evenementImageUrl
) {
    public static BilletResponse fromEntities(Billet billet, Evenement evenement) {
        return new BilletResponse(
                billet.getId(), billet.getCategorie().name(), billet.getCodeQr(), billet.getStatut(),
                billet.getDateAchat(), billet.getDateScan(),
                billet.getEvenementId(),
                evenement != null ? evenement.getTitre() : "Evenement indisponible",
                evenement != null ? evenement.getLieu() : null,
                evenement != null ? evenement.getDateDebut() : null,
                evenement != null ? evenement.getImageUrl() : null
        );
    }
}
