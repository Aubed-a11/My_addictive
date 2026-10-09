import { Platform } from 'react-native';

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '302316778064-6gdvcltrt4na77ao05kjrec1kl3v6v7s.apps.googleusercontent.com';

/**
 * "Se connecter avec Google", implemente via Google Identity Services (le
 * SDK web officiel de Google), seule methode disponible sans passer par un
 * module natif supplementaire -- adapte puisque l'application tourne
 * principalement comme PWA web. Renvoie directement le jeton d'identite
 * (ID token) JWT signe par Google, a transmettre tel quel au backend qui le
 * revérifie de son cote (jamais fait confiance aux seules informations
 * envoyees par le client).
 */
export function googleDisponible() {
  return Platform.OS === 'web' && !!CLIENT_ID;
}

let scriptCharge = null;
function chargerScriptGoogle() {
  if (scriptCharge) return scriptCharge;
  scriptCharge = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Impossible de charger le script Google.'));
    document.head.appendChild(script);
  });
  return scriptCharge;
}

/** Ouvre la fenetre de connexion Google et renvoie l'ID token une fois l'utilisateur connecte (ou rejette si annule/echoue). */
export async function demanderConnexionGoogle() {
  if (!googleDisponible()) {
    throw new Error("La connexion Google n'est pas configuree sur cette installation.");
  }
  await chargerScriptGoogle();
  return new Promise((resolve, reject) => {
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (reponse) => {
        if (reponse?.credential) resolve(reponse.credential);
        else reject(new Error('Connexion Google annulee.'));
      },
    });
    // prompt() ouvre la fenetre "One Tap" / selection de compte Google ;
    // si le navigateur la bloque (ex. pop-up deja ferme recemment), on
    // rejette proprement plutot que de laisser l'utilisateur sans retour.
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        reject(new Error("La fenetre de connexion Google n'a pas pu s'ouvrir. Reessaie, ou verifie que les pop-ups ne sont pas bloquees."));
      }
    });
  });
}
