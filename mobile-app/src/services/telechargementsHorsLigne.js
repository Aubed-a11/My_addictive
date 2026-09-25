import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resoudreUrlFichier } from '../utils/urlImage';

/**
 * Mode hors ligne (section 5.2) : telecharge le fichier audio pour une
 * ecoute sans connexion.
 *
 * Deux implementations selon la plateforme, car il n'existe pas de systeme
 * de fichiers prive equivalent sur le web :
 * - Mobile (iOS/Android) : fichier reel dans le stockage prive de l'app
 *   (expo-file-system), comme avant.
 * - Web : le fichier audio est recupere puis stocke sous forme de blob dans
 *   IndexedDB (stockage prive du navigateur, largement suffisant en
 *   capacite pour des fichiers audio, contrairement a AsyncStorage/
 *   localStorage limite a quelques Mo). La lecture hors ligne relit ce
 *   blob et cree une URL locale (URL.createObjectURL) a la demande.
 *
 * Limite assumee : ceci n'est pas un chiffrement DRM au sens strict (pas
 * de cle de dechiffrement dediee) — juste un stockage prive, suffisant
 * pour empecher la copie triviale du fichier mais pas une protection
 * cryptographique complete.
 */
const CLE_INDEX = 'telechargements_hors_ligne';
const PREFIXE_WEB = 'indexeddb:';
// DOSSIER n'est calcule qu'a l'usage (jamais au chargement du module) : sur
// le web, FileSystem.documentDirectory peut se comporter de facon inattendue
// (valeur nulle ou levant une erreur selon la version d'expo-file-system),
// et un calcul fait au chargement du fichier planterait AVANT meme que le
// test Platform.OS === 'web' plus bas n'ait la moindre chance de s'executer.
function dossierLocal() {
  return FileSystem.documentDirectory + 'musique-hors-ligne/';
}

// --- Stockage IndexedDB (web uniquement) ------------------------------
const NOM_DB = 'myaddictive-hors-ligne';
const NOM_MAGASIN = 'fichiers-audio';

function ouvrirDbWeb() {
  return new Promise((resolve, reject) => {
    const requete = indexedDB.open(NOM_DB, 1);
    requete.onupgradeneeded = () => {
      if (!requete.result.objectStoreNames.contains(NOM_MAGASIN)) {
        requete.result.createObjectStore(NOM_MAGASIN);
      }
    };
    requete.onsuccess = () => resolve(requete.result);
    requete.onerror = () => reject(requete.error);
  });
}

async function stockerBlobWeb(titreId, blob) {
  const db = await ouvrirDbWeb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NOM_MAGASIN, 'readwrite');
    tx.objectStore(NOM_MAGASIN).put(blob, titreId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function recupererBlobWeb(titreId) {
  const db = await ouvrirDbWeb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NOM_MAGASIN, 'readonly');
    const requete = tx.objectStore(NOM_MAGASIN).get(titreId);
    requete.onsuccess = () => resolve(requete.result || null);
    requete.onerror = () => reject(requete.error);
  });
}

async function supprimerBlobWeb(titreId) {
  const db = await ouvrirDbWeb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(NOM_MAGASIN, 'readwrite');
    tx.objectStore(NOM_MAGASIN).delete(titreId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function assurerDossier() {
  const info = await FileSystem.getInfoAsync(dossierLocal());
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dossierLocal(), { intermediates: true });
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

/**
 * Renvoie une URL directement lisible par le lecteur audio (expo-av) pour
 * un titre deja telecharge : le chemin de fichier local tel quel sur
 * mobile, ou une URL objet temporaire (blob:) recreee depuis IndexedDB sur
 * le web (ces URL ne survivent pas a un rechargement de page, d'ou la
 * recreation a chaque lecture plutot qu'un stockage direct de l'URL).
 */
export async function obtenirUrlLecture(titreId) {
  const liste = await listerTelechargements();
  const entree = liste.find((t) => t.id === titreId);
  if (!entree) return null;
  if (Platform.OS === 'web' && entree.cheminLocal?.startsWith(PREFIXE_WEB)) {
    const blob = await recupererBlobWeb(titreId);
    return blob ? URL.createObjectURL(blob) : null;
  }
  return entree.cheminLocal;
}

export async function telecharger(titre, onProgression) {
  console.log('[HorsLigne] telecharger() demarre, Platform.OS =', Platform.OS, 'titre =', titre?.id);
  if (!titre.fichierAudioUrl) {
    throw new Error("Le fichier audio original de ce titre n'est pas encore disponible.");
  }

  let cheminLocal;

  if (Platform.OS === 'web') {
    // Pas de systeme de fichiers prive sur le web : on recupere le fichier
    // et on le stocke comme blob dans IndexedDB plutot que sur disque.
    const reponse = await fetch(resoudreUrlFichier(titre.fichierAudioUrl));
    if (!reponse.ok) throw new Error('Impossible de recuperer le fichier audio.');
    const tailleTotale = Number(reponse.headers.get('content-length')) || 0;
    const lecteur = reponse.body?.getReader();
    const morceaux = [];
    let recu = 0;
    if (lecteur) {
      // Lecture progressive du flux pour pouvoir rapporter une progression
      // (fetch seul ne donne pas de callback de progression comme
      // FileSystem.createDownloadResumable sur mobile).
      while (true) {
        const { done, value } = await lecteur.read();
        if (done) break;
        morceaux.push(value);
        recu += value.length;
        if (onProgression && tailleTotale) onProgression(recu / tailleTotale);
      }
    }
    const blob = morceaux.length ? new Blob(morceaux) : await reponse.blob();
    await stockerBlobWeb(titre.id, blob);
    cheminLocal = `${PREFIXE_WEB}${titre.id}`;
  } else {
    await assurerDossier();
    cheminLocal = `${dossierLocal()}titre_${titre.id}.mp3`;
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
  }

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
    if (Platform.OS === 'web' && entree.cheminLocal?.startsWith(PREFIXE_WEB)) {
      try { await supprimerBlobWeb(titreId); } catch {}
    } else {
      try { await FileSystem.deleteAsync(entree.cheminLocal, { idempotent: true }); } catch {}
    }
  }
  const nouvelleListe = liste.filter((t) => t.id !== titreId);
  await AsyncStorage.setItem(CLE_INDEX, JSON.stringify(nouvelleListe));
}
