package bj.myaddictive.paiement.messaging;

import bj.myaddictive.paiement.domain.TypeObjetPaiement;

import java.io.Serializable;

/** Evenement publie apres confirmation d'un paiement (cf. regle "aucune emission avant confirmation"). */
public record PaiementConfirmeEvent(
        Long transactionId,
        Long utilisateurId,
        TypeObjetPaiement typeObjet,
        String referenceId,
        Long montantFcfa
) implements Serializable {}
