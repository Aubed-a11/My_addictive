package bj.myaddictive.compte.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ConnexionRequest(
        @NotBlank @Email(message = "Adresse email invalide.") String email,
        @NotBlank(message = "Le mot de passe est obligatoire.") String motDePasse
) {}
