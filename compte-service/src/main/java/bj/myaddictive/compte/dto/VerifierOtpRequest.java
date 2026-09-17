package bj.myaddictive.compte.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifierOtpRequest(
        @NotBlank String indicatifPays,
        @NotBlank String telephone,
        @NotBlank(message = "Le code de verification est obligatoire.") String code
) {}
