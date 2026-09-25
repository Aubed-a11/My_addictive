import { ouvrirWidgetKkiapay } from './kkiapay';
import client from '../api/client';

const CLE_PUBLIQUE = process.env.EXPO_PUBLIC_KKIAPAY_PUBLIC_KEY;
const SANDBOX = process.env.EXPO_PUBLIC_KKIAPAY_SANDBOX !== 'false';

/**
 * Enchaine tout le cycle KKiaPay pour une transaction deja creee
 * (EN_ATTENTE) cote paiement-service : ouvre le widget, lie l'identifiant
 * KKiaPay obtenu a notre transaction, puis interroge periodiquement le
 * statut jusqu'a confirmation (webhook cote serveur) ou expiration.
 *
 * Ne fait JAMAIS confiance au seul retour du widget : c'est le webhook
 * KKiaPay, traite cote serveur, qui fait foi (voir PaiementService.
 * traiterWebhookKkiapay). Cette fonction se contente d'attendre ce
 * resultat pour donner un retour a l'utilisateur.
 */
export function payerAvecKkiapay({ transactionId, montantFcfa, telephone, email, motif }) {
  return new Promise((resolve, reject) => {
    if (!CLE_PUBLIQUE) {
      reject(new Error("KKiaPay n'est pas configure (cle publique manquante, voir mobile-app/.env)."));
      return;
    }

    ouvrirWidgetKkiapay({
      montantFcfa,
      cleApiPublique: CLE_PUBLIQUE,
      sandbox: SANDBOX,
      telephone,
      email,
      motif,
      onSucces: async (data) => {
        try {
          await client.post(`/api/paiement/transactions/${transactionId}/lier-externe`, {
            idTransactionExterne: data.transactionId,
          });
          const transactionFinale = await attendreConfirmation(transactionId);
          resolve(transactionFinale);
        } catch (e) {
          reject(e);
        }
      },
      onEchec: () => {
        reject(new Error("Paiement KKiaPay annule ou echoue."));
      },
    }).catch(reject);
  });
}

/** Interroge le statut de la transaction toutes les 2 secondes, jusqu'a confirmation ou 90 secondes ecoulees (le webhook KKiaPay met generalement quelques secondes). */
async function attendreConfirmation(transactionId, tentativesMax = 45) {
  for (let i = 0; i < tentativesMax; i++) {
    const { data } = await client.get(`/api/paiement/transactions/${transactionId}`);
    if (data.statut !== 'EN_ATTENTE') return data;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Le paiement met plus de temps que prevu a se confirmer. Vous pouvez verifier son statut plus tard dans Mon compte > Transactions.");
}
