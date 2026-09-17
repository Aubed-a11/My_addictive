import { Platform } from 'react-native';

/**
 * Integration KKiaPay pour le web (notre plateforme de deploiement
 * actuelle - PWA). KKiaPay expose un SDK officiel pour React Native
 * (@kkiapay-org/react-native-sdk), mais celui-ci s'appuie sur
 * react-native-webview, qui n'a pas d'equivalent web fiable - cette
 * fonction reproduit donc directement l'integration JS web documentee par
 * KKiaPay (script + fonctions globales openKkiapayWidget/addSuccessListener/
 * addFailedListener), avec exactement la meme API que le hook React Native
 * officiel pour rester coherent si une version native est ajoutee plus tard.
 *
 * Regle d'or inchangee : le retour "succes" du widget ne confirme JAMAIS le
 * paiement a lui seul (un utilisateur malveillant pourrait forger cet
 * evenement cote client) - il sert uniquement a lier l'identifiant de
 * transaction KKiaPay a notre transaction interne (voir lier-externe), la
 * confirmation reelle venant toujours du webhook KKiaPay cote serveur.
 */

let promesseScriptCharge = null;

function chargerScriptKkiapay() {
  if (Platform.OS !== 'web') {
    return Promise.reject(new Error('KKiaPay web n\'est disponible que sur la plateforme web pour le moment.'));
  }
  if (promesseScriptCharge) return promesseScriptCharge;

  promesseScriptCharge = new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.openKkiapayWidget) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.kkiapay.me/k.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Impossible de charger le script KKiaPay (verifiez la connexion internet)."));
    document.body.appendChild(script);
  });
  return promesseScriptCharge;
}

/**
 * Ouvre le widget de paiement KKiaPay. onSucces recoit { transactionId },
 * onEchec recoit les details de l'echec (peut etre appele aussi si
 * l'utilisateur ferme simplement le widget sans payer, selon KKiaPay).
 */
export async function ouvrirWidgetKkiapay({ montantFcfa, cleApiPublique, sandbox, telephone, email, motif, onSucces, onEchec }) {
  await chargerScriptKkiapay();

  const succesListener = (data) => {
    window.removeAddSuccessListener?.(succesListener);
    onSucces(data);
  };
  const echecListener = (data) => {
    onEchec(data);
  };

  window.addSuccessListener(succesListener);
  window.addFailedListener?.(echecListener);

  window.openKkiapayWidget({
    amount: montantFcfa,
    api_key: cleApiPublique,
    sandbox: !!sandbox,
    phone: telephone || undefined,
    email: email || undefined,
    reason: motif || 'Paiement My Addictive',
  });
}
