package bj.myaddictive.boutique.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AjouterPanierRequest(@NotNull Long produitId, @NotNull @Positive Integer quantite) {}
