package bj.myaddictive.app;

/**
 * Adresse de l'application elle-meme, utilisee pour les appels entre domaines
 * (ex. boutique -> paiement) qui passaient avant par Eureka (http://paiement-service/...).
 * Ces appels restent de simples requetes HTTP sur la boucle locale : meme contrat qu'avant,
 * sans passer par la passerelle (donc sans le filtre JWT, comme avant).
 */
public final class UrlInterne {
    private UrlInterne() {}

    public static String base() {
        String port = System.getenv("SERVER_PORT");
        if (port == null || port.isBlank()) port = "8080";
        return "http://localhost:" + port.trim();
    }
}
