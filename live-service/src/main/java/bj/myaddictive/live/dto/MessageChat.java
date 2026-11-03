package bj.myaddictive.live.dto;

public record MessageChat(String auteur, String contenu) {
    /** Bornes de taille : un client ne peut plus envoyer un message geant ni un nom d'auteur interminable. */
    public MessageChat {
        auteur = (auteur == null || auteur.isBlank()) ? "Anonyme" : auteur.strip();
        if (auteur.length() > 40) auteur = auteur.substring(0, 40);
        contenu = contenu == null ? "" : contenu.strip();
        if (contenu.length() > 300) contenu = contenu.substring(0, 300);
    }
}
