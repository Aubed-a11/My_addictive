/** Extrait l'identifiant d'une video a partir de n'importe quel format d'URL YouTube courant (watch?v=, youtu.be/, embed/, shorts/). Renvoie null si l'URL n'est pas reconnue. */
export function extraireIdYoutube(url) {
  if (!url) return null;
  const correspondances = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const motif of correspondances) {
    const trouve = url.match(motif);
    if (trouve) return trouve[1];
  }
  return null;
}

/** Vignette officielle YouTube (haute qualite) pour un identifiant de video donne. */
export function vignetteYoutube(idVideo) {
  return `https://img.youtube.com/vi/${idVideo}/hqdefault.jpg`;
}

/**
 * Adresse "integrable" (iframe / WebView) pour les liens YouTube et Vimeo, qui refusent d'etre affiches
 * depuis leur page normale (watch?v=...). Renvoie null si le lien n'est ni YouTube ni Vimeo (fichier video, HLS...).
 */
export function urlIntegrable(url, lectureAuto = true) {
  if (!url) return null;
  const idYoutube = extraireIdYoutube(url);
  if (idYoutube) return `https://www.youtube.com/embed/${idYoutube}?rel=0&playsinline=1${lectureAuto ? '&autoplay=1' : ''}`;
  const vimeo = String(url).match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}${lectureAuto ? '?autoplay=1' : ''}`;
  // Direct YouTube sans identifiant 11 car. reconnu (ex. /live/ID) : tente l'extraction simple.
  const live = String(url).match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (live) return `https://www.youtube.com/embed/${live[1]}?rel=0&playsinline=1${lectureAuto ? '&autoplay=1' : ''}`;
  return null;
}
