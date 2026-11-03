package bj.myaddictive.live.dto;

import bj.myaddictive.live.domain.CategorieBillet;
import jakarta.validation.constraints.NotNull;

public record InitierAchatBilletRequest(@NotNull Long evenementId, @NotNull CategorieBillet categorie, @NotNull String moyenPaiement, String telephonePayeur) {}
