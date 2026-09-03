package bj.myaddictive.compte.dto;

import jakarta.validation.constraints.NotBlank;

public record FavoriRequest(@NotBlank String typeCible, @NotBlank String referenceId) {}
