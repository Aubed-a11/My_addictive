package bj.myaddictive.boutique.dto;

import jakarta.validation.constraints.NotBlank;

public record InscriptionVendeurRequest(
        @NotBlank String nomBoutique, String description, String imageUrl, @NotBlank String categorie
) {}
