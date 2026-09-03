import { API_BASE_URL } from '../api/client';

/**
 * Resout une URL d'image renvoyee par le backend :
 * - une URL absolue (http/https) est utilisee telle quelle
 * - un chemin relatif (ex. /api/media/fichiers/artistes/albums/1000/xxx.png,
 *   utilise pour les images legacy servies par notre propre backend) est
 *   prefixe par l'adresse actuelle du serveur, pour fonctionner aussi bien
 *   sur telephone physique, emulateur ou navigateur (l'adresse change selon
 *   l'environnement, voir mobile-app/.env).
 */
export function resoudreUrlImage(url) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Meme logique, nom neutre pour les usages non-image (fichiers audio...).
export const resoudreUrlFichier = resoudreUrlImage;
