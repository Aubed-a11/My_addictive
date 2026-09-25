/**
 * Identite visuelle calquee sur la maquette de reference fournie par le
 * commanditaire : chaque rubrique a sa propre couleur d'accent, utilisee a
 * la fois pour ses cartes, ses icones et sa barre d'onglets contextuelle.
 */
export const COLORS = {
  fond: '#0A0A0F',
  fondCarte: '#16151F',
  fondCarteClair: '#1E1D2A',
  texte: '#FFFFFF',
  texteAtténué: '#9A97AE',
  bordure: '#2A2836',

  or: '#FFCC21',        // spirale du logo
  orFonce: '#E0AC00',
  bleuMarque: '#05638E', // "ddictive" et details du logo

  hub: '#FFCC21',
  media: '#3B82F6',       // 1. Media — bleu
  musique: '#22C55E',     // 2. Musique — vert
  billetterie: '#F97316', // 3. Billetterie — orange
  live: '#EF4444',        // 4. Live — rouge
  votes: '#A855F7',       // 5. Votes — violet
  radio: '#06B6D4',       // 6. Radio — cyan (hors perimetre du cahier des charges)
  boutique: '#D97706',    // 7. Boutique — ambre
  compte: '#14B8A6',      // 8. Mon compte — turquoise
};

export const DEGRADES = {
  media: ['#3B82F6', '#1D4ED8'],
  musique: ['#22C55E', '#15803D'],
  billetterie: ['#F97316', '#C2410C'],
  live: ['#EF4444', '#B91C1C'],
  votes: ['#A855F7', '#6D28D9'],
  boutique: ['#D97706', '#92400E'],
};

export default COLORS;
