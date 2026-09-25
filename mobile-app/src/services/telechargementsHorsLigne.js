import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resoudreUrlFichier } from '../utils/urlImage';

/**
 * Mode hors ligne (section 5.2) : telecharge le fichier audio dans le
 * stockage prive de l'application (sandbox iOS/Android, non accessible
 * depuis un explorateur de fichiers classique ni par une autre app) pour
 * une ecoute sans connexion.
 *
 * Limite assumee : ceci n'est pas un chiffrement DRM au sens strict (pas
 * de cle de dechiffrement dediee) — juste un stockage prive au bac a
 * sable de l'app, suffisant pour empecher la copie triviale du fichier
 * mais pas une protection cryptographique complete. A renforcer avec un
 * vrai conteneur chiffre (ex. FileSystem + expo-crypto ou une librairie
 * DRM dediee) avant une mise en production a grande echelle.
 */
const CLE_INDEX = 'telechargements_hors_ligne';
const DOSSIER = FileSystem.documentDirectory + 'musique-hors-ligne/';

async function assurerDossier() {
  const info = await FileSystem.getInfoAsync(DOSSIER);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DOSSIER, { intermediates: true });
  }
}

export async function listerTelechargements() {
  const brut = await AsyncStorage.getItem(CLE_INDEX);
  return brut ? JSON.parse(brut) : [];
}

export async function estTelecharge(titreId) {
  const liste = await listerTelechargements();
  return liste.some((t) => t.id === titreId);
}

export async function telecharger(titre, onProgression) {
  if (!titre.fichierAudioUrl) {
    throw new Error("Le fichier audio original de ce titre n'est pas encore disponible.");
  }
  await assurerDossier();
  const cheminLocal = `${DOSSIER}titre_${titre.id}.mp3`;

  const telechargeur = FileSystem.createDownloadResumable(
    resoudreUrlFichier(titre.fichierAudioUrl),
    cheminLocal,
    {},
    (progression) => {
      if (onProgression) {
        const pourcentage = progression.totalBytesWritten / progression.totalBytesExpectedToWrite;
        onProgression(pourcentage);
      }
    }
  );

  await telechargeur.downloadAsync();

  const liste = await listerTelechargements();
  const nouvelleListe = [
    ...liste.filter((t) => t.id !== titre.id),
    { id: titre.id, nom: titre.nom, artiste: titre.artiste, cheminLocal, dateTelechargement: new Date().toISOString() },
  ];
  await AsyncStorage.setItem(CLE_INDEX, JSON.stringify(nouvelleListe));
}

export async function supprimerTelechargement(titreId) {
  const liste = await listerTelechargements();
  const entree = liste.find((t) => t.id === titreId);
  if (entree) {
    try { await FileSystem.deleteAsync(entree.cheminLocal, { idempotent: true }); } catch {}
  }
  const nouvelleListe = liste.filter((t) => t.id !== titreId);
  await AsyncStorage.setItem(CLE_INDEX, JSON.stringify(nouvelleListe));
}
