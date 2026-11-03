package bj.myaddictive.paiement.dto;

import bj.myaddictive.paiement.domain.MoyenPaiement;
import bj.myaddictive.paiement.domain.TypeObjetPaiement;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record InitierPaiementRequest(
        @NotNull MoyenPaiement moyenPaiement,
        @NotNull @Positive Long montantFcfa,
        @NotNull TypeObjetPaiement typeObjet,
        @NotNull String referenceId,
        String telephonePayeur // requis pour MTN_MOMO/MOOV_MONEY/CELTIIS_CASH (numero MSISDN du portefeuille mobile money), inutile pour CARTE_BANCAIRE/AGENCE
) {}
