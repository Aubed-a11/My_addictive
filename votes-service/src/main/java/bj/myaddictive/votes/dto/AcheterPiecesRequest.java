package bj.myaddictive.votes.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record AcheterPiecesRequest(@NotNull @Positive Long nombrePieces, @NotNull Long montantFcfa, @NotNull String moyenPaiement) {}
