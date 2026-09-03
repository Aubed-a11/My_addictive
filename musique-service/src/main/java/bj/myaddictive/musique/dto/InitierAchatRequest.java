package bj.myaddictive.musique.dto;

import bj.myaddictive.musique.domain.Titre;
import jakarta.validation.constraints.NotNull;

public record InitierAchatRequest(@NotNull Long titreId, @NotNull String moyenPaiement) {}
