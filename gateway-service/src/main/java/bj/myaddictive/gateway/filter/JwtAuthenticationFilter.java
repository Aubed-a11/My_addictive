package bj.myaddictive.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Verifie le jeton JWT (RS256/HS256) sur les routes qui exigent une
 * connexion (achat, vote, panier, publication ...). Les routes de
 * consultation libre (lecture des rubriques par un Visiteur non connecte)
 * restent ouvertes, conformement a la regle "acces libre / restriction au
 * passage a l'action" du cahier des charges.
 *
 * Le microservice cible peut re-verifier ce meme jeton localement : la
 * gateway transmet l'utilisateur authentifie via l'en-tete X-User-Id.
 */
@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private final SecretKey key;

    // Prefixes de chemins qui exigent une connexion prealable, quelle que soit la methode.
    private static final List<String> PROTECTED_PREFIXES = List.of(
            "/api/compte/moi", "/api/compte/favoris", "/api/compte/admin",
            "/api/musique/achats", "/api/musique/mes-achats", "/api/musique/mes-ecoutes", "/api/musique/recommandations",
            "/api/live/billets", "/api/live/abonnements-chaine", "/api/live/sondages",
            "/api/live/mes-chaines-suivies", "/api/live/mes-evenements",
            "/api/votes/voter", "/api/votes/portefeuille", "/api/votes/mes-votes",
            "/api/boutique/panier", "/api/boutique/commandes", "/api/boutique/vendeurs/inscription",
            "/api/boutique/vendeurs/admin",
            "/api/paiement/transactions"
            // NB : /api/paiement/webhook/** reste public : c'est l'agregateur mobile money/carte qui l'appelle,
            // pas un utilisateur muni d'un jeton. A securiser en production par verification de signature/IP.
    );

    // Contenu gere par le back-office (evenements, competitions, catalogue...) : la
    // consultation (GET) reste libre pour tous, seule l'ecriture (creation/modification/
    // suppression, reservee aux administrateurs) exige une connexion. Le controleur
    // cible revalide ensuite le role ADMINISTRATEUR via l'en-tete X-User-Role.
    private static final List<String> PREFIXES_ADMIN_ECRITURE = List.of(
            "/api/live/evenements", "/api/live/chaines",
            "/api/votes/competitions", "/api/votes/candidats",
            "/api/musique/titres", "/api/musique/albums",
            "/api/boutique/produits", "/api/boutique/vendeurs",
            "/api/media/articles", "/api/live/podcasts"
    );

    // Suffixes toujours publics, meme s'ils partagent un prefixe avec des routes
    // d'ecriture protegees (ex. /api/musique/titres/{id}/ecouter est un simple
    // compteur de lecture public, malgre le prefixe /api/musique/titres reserve
    // par ailleurs a l'administration du catalogue).
    private static final List<String> SUFFIXES_TOUJOURS_PUBLICS = List.of(
            "/ecouter", "/spectateurs/entrer", "/spectateurs/sortir"
    );

    private static final String SECRET_PAR_DEFAUT = "myaddictive-dev-secret-change-in-production-0123456789";

    public JwtAuthenticationFilter(@Value("${jwt.secret:" + SECRET_PAR_DEFAUT + "}") String secret,
                                    org.springframework.core.env.Environment environnement) {
        boolean estProd = java.util.Arrays.asList(environnement.getActiveProfiles()).contains("prod");
        if (estProd && (secret == null || secret.isBlank() || secret.equals(SECRET_PAR_DEFAUT))) {
            throw new IllegalStateException(
                "JWT_SECRET manquant ou laisse a sa valeur de developpement en production. " +
                "Genere une vraie valeur (ex. `openssl rand -base64 48`) et renseigne-la dans .env.production."
            );
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        String methode = exchange.getRequest().getMethod() != null ? exchange.getRequest().getMethod().name() : "GET";

        if (SUFFIXES_TOUJOURS_PUBLICS.stream().anyMatch(path::endsWith)) {
            return chain.filter(exchange);
        }

        boolean requiresAuth = PROTECTED_PREFIXES.stream().anyMatch(path::startsWith);
        if (!requiresAuth && !"GET".equals(methode)) {
            requiresAuth = PREFIXES_ADMIN_ECRITURE.stream().anyMatch(path::startsWith);
        }

        List<String> authHeaders = exchange.getRequest().getHeaders().get("Authorization");
        boolean jetonPresent = authHeaders != null && !authHeaders.isEmpty() && authHeaders.get(0).startsWith("Bearer ");

        if (!requiresAuth && !jetonPresent) {
            // Route libre, aucun jeton fourni : on laisse passer tel quel.
            return chain.filter(exchange);
        }

        if (!jetonPresent) {
            return unauthorized(exchange, "Connexion requise pour effectuer cette action.");
        }

        String token = authHeaders.get(0).substring(7);
        try {
            Claims claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(token).getPayload();
            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                    .header("X-User-Id", claims.getSubject())
                    .header("X-User-Role", String.valueOf(claims.get("role")))
                    .build();
            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        } catch (Exception e) {
            if (requiresAuth) {
                return unauthorized(exchange, "Jeton invalide ou expire.");
            }
            // Route libre mais jeton fourni invalide/expire : on ignore le jeton
            // plutot que de bloquer une consultation qui n'exige pas de connexion.
            return chain.filter(exchange);
        }
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().add("Content-Type", "application/json");
        byte[] bytes = ("{\"error\":\"" + message + "\"}").getBytes(StandardCharsets.UTF_8);
        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(bytes)));
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
