package bj.myaddictive.boutique.dto;

import jakarta.validation.constraints.NotBlank;

public record InitierCommandeRequest(@NotBlank String moyenPaiement) {}
