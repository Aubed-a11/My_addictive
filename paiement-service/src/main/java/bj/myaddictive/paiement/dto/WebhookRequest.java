package bj.myaddictive.paiement.dto;

import bj.myaddictive.paiement.domain.StatutTransaction;

/** Correspond a la charge utile envoyee par l'agregateur mobile money lors du callback de confirmation. */
public record WebhookRequest(StatutTransaction statut, String idTransactionExterne) {}
