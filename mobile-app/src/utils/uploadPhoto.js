import { Platform } from 'react-native';

/**
 * Construit le FormData pour l'upload d'une photo, de maniere compatible
 * avec les deux environnements d'execution :
 * - React Native natif (iOS/Android) : accepte un objet {uri, name, type},
 *   convention historique de React Native pour representer un fichier local.
 * - Expo Web (navigateur) : le FormData du navigateur exige un vrai objet
 *   File/Blob ; passer l'objet {uri, name, type} echoue silencieusement (le
 *   champ est simplement ignore ou vide cote serveur), ce qui explique
 *   qu'une photo choisie a l'inscription ou dans les parametres ne
 *   s'affichait jamais malgre un envoi apparemment reussi. Sur web, il faut
 *   donc recuperer le blob reel derriere l'URI (souvent une blob: URL)
 *   avant de l'ajouter au FormData.
 */
export async function construireFormDataPhoto(image, nomChamp = 'fichier') {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    const reponse = await fetch(image.uri);
    const blob = await reponse.blob();
    const nomFichier = image.fileName || `photo.${(blob.type.split('/')[1]) || 'jpg'}`;
    formData.append(nomChamp, blob, nomFichier);
  } else {
    formData.append(nomChamp, {
      uri: image.uri,
      name: image.fileName || 'photo.jpg',
      type: image.mimeType || 'image/jpeg',
    });
  }

  return formData;
}
