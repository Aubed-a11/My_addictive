import React from 'react';
import { Image } from 'react-native';

// Dimensions reelles du fichier logo fourni (1140x385), pour conserver le
// ratio exact quelle que soit la taille demandee a l'affichage.
const LARGEUR_ORIGINALE = 1140;
const HAUTEUR_ORIGINALE = 385;
const RATIO = LARGEUR_ORIGINALE / HAUTEUR_ORIGINALE;

/**
 * Logo officiel My Addictive (fichier fourni par le commanditaire), rendu
 * directement en image plutot qu'en reconstruction approximative par code.
 * "taille" represente la hauteur souhaitee en pixels ; la largeur est
 * deduite automatiquement du ratio d'origine.
 */
export default function Logo({ taille = 64 }) {
  return (
    <Image
      source={require('../../assets/images/logo_myaddictive.png')}
      style={{ height: taille, width: taille * RATIO }}
      resizeMode="contain"
    />
  );
}
