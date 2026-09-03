/**
 * Degrade du bouton principal des ecrans d'authentification (rose -> violet).
 * FOND_AUTH et INDICATIFS (indicatifs telephoniques + couleurs de drapeaux)
 * ont ete retires : c'etaient des restes de l'ancien systeme d'inscription
 * par telephone/OTP, remplace depuis par l'authentification email + mot de
 * passe (voir FondAuth.js, qui utilise desormais une vraie photo en fond).
 */
export const DEGRADE_BOUTON = ['#EC4899', '#8B5CF6'];
