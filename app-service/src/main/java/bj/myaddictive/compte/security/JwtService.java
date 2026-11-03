package bj.myaddictive.compte.security;

import bj.myaddictive.compte.domain.Utilisateur;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

/**
 * Emission du jeton JWT (compte-service est la seule source de verite pour
 * l'authentification, cf. section 21.3 du cahier des charges technique).
 * Signature HS256 partagee via la configuration centralisee (jwt.secret) ;
 * a faire evoluer vers RS256 (cle privee ici, cles publiques distribuees
 * aux autres services) avant mise en production.
 */
@Component
public class JwtService {

    private final SecretKey key;
    private final long expirationMinutes;

    private static final String SECRET_PAR_DEFAUT = "myaddictive-dev-secret-change-in-production-0123456789";

    public JwtService(@Value("${jwt.secret:" + SECRET_PAR_DEFAUT + "}") String secret,
                       @Value("${jwt.expiration-minutes:120}") long expirationMinutes,
                       org.springframework.core.env.Environment environnement) {
        // En production (profil "prod", active via SPRING_PROFILES_ACTIVE dans
        // docker-compose.yml), on refuse categoriquement de demarrer avec le
        // secret de developpement ou une valeur vide : mieux vaut un echec de
        // demarrage immediat et explicite qu'une API JWT signee avec un secret
        // connu de tous, decouverte bien plus tard.
        boolean estProd = java.util.Arrays.asList(environnement.getActiveProfiles()).contains("prod");
        if (estProd && (secret == null || secret.isBlank() || secret.equals(SECRET_PAR_DEFAUT))) {
            throw new IllegalStateException(
                "JWT_SECRET manquant ou laisse a sa valeur de developpement en production. " +
                "Genere une vraie valeur (ex. `openssl rand -base64 48`) et renseigne-la dans .env.production."
            );
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
    }

    public String genererJeton(Utilisateur utilisateur) {
        Instant maintenant = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(utilisateur.getId()))
                .claim("email", utilisateur.getEmail())
                .claim("role", utilisateur.getRole().name())
                .issuedAt(Date.from(maintenant))
                .expiration(Date.from(maintenant.plus(expirationMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }
}
