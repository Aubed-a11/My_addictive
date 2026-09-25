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
