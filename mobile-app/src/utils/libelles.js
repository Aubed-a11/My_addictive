/**
 * Met en forme un libelle technique brut (valeur d'enumeration ou de
 * categorie stockee en base, ex. "EN_LICE", "HIGH_TECH", "A_VENIR") en un
 * texte lisible avec une casse et une ponctuation normales ("En lice",
 * "High-tech", "A venir"), plutot que de l'afficher tel quel a l'ecran.
 */
const LIBELLES_CONNUS = {
  A_VENIR: 'À venir',
  EN_DIRECT: 'En direct',
  TERMINE: 'Terminé',
  REPLAY: 'Replay',
  EN_LICE: 'En lice',
  ELIMINE: 'Éliminé',
  ELIMINATIONS: 'Éliminatoires',
  QUALIFIE: 'Qualifié',
  VAINQUEUR: 'Vainqueur',
  MODE: 'Mode',
  HIGH_TECH: 'High-tech',
  BEAUTE: 'Beauté',
  MAISON: 'Maison',
  ACCESSOIRES: 'Accessoires',
  ACTUALITE: 'Actualité',
  SHOWBIZ: 'Showbiz',
  VIDEO: 'Vidéo',
  EN_ATTENTE: 'En attente',
  CONFIRMEE: 'Confirmée',
  ECHOUEE: 'Échouée',
  ANNULEE: 'Annulée',
  LIVREE: 'Livrée',
  EXPEDIEE: 'Expédiée',
  STANDARD: 'Standard',
  VIP: 'VIP',
};

export function formaterLibelle(valeurBrute) {
  if (!valeurBrute) return '';
  if (LIBELLES_CONNUS[valeurBrute]) return LIBELLES_CONNUS[valeurBrute];
  const texte = valeurBrute.replace(/_/g, ' ').toLowerCase();
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/**
 * Met en forme un genre musical stocke au format brut du projet
 * ("afro#gospel#", avec un "#" de separation y compris a la fin), en une
 * liste lisible ("Afro, Gospel").
 */
export function formaterGenre(genreBrut) {
  if (!genreBrut) return '';
  return genreBrut
    .split('#')
    .filter(Boolean)
    .map((g) => g.charAt(0).toUpperCase() + g.slice(1).toLowerCase())
    .join(', ');
}

/**
 * Retire toute mention "[DEMO]" (avec les espaces qui l'entourent) d'un
 * texte, pour ne jamais exposer ce marqueur de contenu de demonstration
 * dans une presentation publique.
 */
export function retirerMentionDemo(texte) {
  if (!texte) return texte;
  return texte.replace(/\s*\[DEMO\]\s*/gi, ' ').trim();
}
