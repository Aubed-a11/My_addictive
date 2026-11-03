package bj.myaddictive.compte.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record MotDePasseOublieRequest(@NotBlank @Email(message = "Adresse email invalide.") String email) {}
