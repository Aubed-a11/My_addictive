import React, { useEffect, useState } from 'react';
import { Check, Wallet } from 'lucide-react';
import client from '../api/client';

const LIBELLES_TYPE_OBJET = {
  BILLET: 'Billet evenement',
  TITRE: 'Achat titre',
  VOTE: 'Recharge pieces (votes)',
  COMMANDE: 'Commande boutique',
};

/**
 * Confirmation manuelle des paiements en agence (especes remises en main
 * propre) : le seul moyen de paiement qui, par nature, ne peut jamais etre
 * confirme automatiquement (voir paiement-service / MtnMomoClient). Cette
 * page est le seul endroit de toute la plateforme ou une action humaine
 * declenche l'emission d'un billet/titre/vote/commande - a utiliser
 * uniquement une fois l'espece effectivement receptionnee et verifiee
 * physiquement au guichet.
 */
export default function Paiements() {
  const [transactions, setTransactions] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [enConfirmation, setEnConfirmation] = useState(null);

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await client.get('/api/paiement/transactions/admin/agence-en-attente');
      setTransactions(data || []);
    } finally { setChargement(false); }
  };
  useEffect(() => { charger(); }, []);

  const confirmer = async (transaction) => {
    if (!window.confirm(`Confirmer avoir bien recu ${transaction.montantFcfa} FCFA en especes de l'utilisateur #${transaction.utilisateurId} ?\n\nCette action est irreversible et declenchera immediatement l'emission du billet/titre/vote correspondant.`)) {
      return;
    }
    setEnConfirmation(transaction.id);
    try {
      await client.post(`/api/paiement/transactions/${transaction.id}/confirmer-agence`);
      charger();
    } catch (e) {
      alert(e.message);
    } finally {
      setEnConfirmation(null);
    }
  };

  return (
    <div className="contenu-principal">
      <div className="entete-page">
        <div><h1>Paiements en agence</h1><p>Confirmer manuellement les especes recues au guichet</p></div>
      </div>

      <div className="carte" style={{ marginBottom: 16, padding: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Wallet size={18} style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ margin: 0, fontSize: 13, color: 'var(--texte-attenue, #888)' }}>
          Ces transactions sont le seul moyen de paiement de la plateforme qui necessite une verification humaine :
          aucun billet, titre, ou credit de pieces n'est emis tant que la confirmation n'a pas ete faite ici, une fois
          l'espece effectivement receptionnee et comptee au guichet.
        </p>
      </div>

      <div className="carte">
        {chargement ? <p className="vide">Chargement...</p> : transactions.length === 0 ? (
          <p className="vide">Aucun paiement en agence en attente de verification.</p>
        ) : (
          <table>
            <thead><tr><th>Date</th><th>Utilisateur</th><th>Objet</th><th>Reference</th><th>Montant</th><th></th></tr></thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.dateCreation).toLocaleString('fr-FR')}</td>
                  <td>#{t.utilisateurId}</td>
                  <td>{LIBELLES_TYPE_OBJET[t.typeObjet] || t.typeObjet}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{t.referenceId}</td>
                  <td><strong>{t.montantFcfa.toLocaleString('fr-FR')} FCFA</strong></td>
                  <td className="actions-ligne">
                    <button
                      className="bouton"
                      disabled={enConfirmation === t.id}
                      onClick={() => confirmer(t)}
                    >
                      <Check size={15} /> {enConfirmation === t.id ? 'Confirmation...' : 'Confirmer la reception'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
