package bj.myaddictive.compte.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReinitialiserMotDePasseRequest(
        @NotBlank @Email(message = "Adresse email invalide.") String email,
        @NotBlank String code,
        @NotBlank @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caracteres.") String nouveauMotDePasse
) {}
