package bj.myaddictive.paiement.domain;

/** Nature de ce qui est paye ; determine quel microservice ecoutera l'evenement de confirmation. */
public enum TypeObjetPaiement { TITRE, ALBUM, BILLET, PORTEFEUILLE_PIECES, COMMANDE, ABONNEMENT_CHAINE, FAN_CLUB, REPLAY }
