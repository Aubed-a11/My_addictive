package bj.myaddictive.compte.dto;

import jakarta.validation.constraints.NotBlank;

/** Jeton d'identite (ID token) fourni par Google Identity Services cote client, a verifier cote serveur. */
public record ConnexionGoogleRequest(@NotBlank String idToken) {}
