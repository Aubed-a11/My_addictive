import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';
import client from '../api/client';

const LIBELLES_STATUT_COMMANDE = { EN_ATTENTE: 'En attente de paiement', PAYEE: 'Payee', ECHOUEE: 'Echouee' };
const OPTIONS_LIVRAISON = ['EN_PREPARATION', 'EXPEDIE', 'LIVRE'];
const LIBELLES_LIVRAISON = { EN_PREPARATION: 'En preparation', EXPEDIE: 'Expedie', LIVRE: 'Livre' };

/**
 * Suivi logistique de toutes les commandes, tous acheteurs confondus
 * (section 8.1). Avant cet ajout, le champ "statut de livraison" existait
 * cote donnees et s'affichait cote client, mais rien ne permettait jamais
 * de le faire evoluer : toute commande restait indefiniment "En
 * preparation" aux yeux de l'acheteur, meme reellement livree.
 */
export default function Commandes() {
  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [commandeOuverte, setCommandeOuverte] = useState(null);
  const [lignesParCommande, setLignesParCommande] = useState({});

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await client.get('/api/boutique/commandes/admin');
      setCommandes(data);
    } finally { setChargement(false); }
  };
  useEffect(() => { charger(); }, []);

  const basculer = async (commandeId) => {
    if (commandeOuverte === commandeId) { setCommandeOuverte(null); return; }
    if (!lignesParCommande[commandeId]) {
      const { data } = await client.get(`/api/boutique/commandes/${commandeId}/lignes`);
      setLignesParCommande((prev) => ({ ...prev, [commandeId]: data }));
    }
    setCommandeOuverte(commandeId);
  };

  const changerStatutLivraison = async (ligne, commandeId, nouveauStatut) => {
    // Mise a jour optimiste pour un retour immediat, avant confirmation serveur.
    setLignesParCommande((prev) => ({
      ...prev,
      [commandeId]: prev[commandeId].map((l) => (l.id === ligne.id ? { ...l, statutLivraison: nouveauStatut } : l)),
    }));
    try {
      await client.put(`/api/boutique/commandes/lignes/${ligne.id}/statut-livraison`, { statutLivraison: nouveauStatut });
    } catch {
      basculer(commandeId); basculer(commandeId); // resynchronise en cas d'echec (rouvre pour re-fetcher)
    }
  };

  return (
    <div className="contenu-principal">
      <div className="entete-page">
        <div><h1>Commandes</h1><p>Suivi logistique de toutes les commandes clients</p></div>
      </div>

      <div className="carte">
        {chargement ? <p className="vide">Chargement...</p> : commandes.length === 0 ? (
          <p className="vide">Aucune commande pour le moment.</p>
        ) : (
          commandes.map((c) => (
            <div key={c.id} style={{ borderBottom: '1px solid var(--bordure, #333)', padding: '14px 0' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => basculer(c.id)}
              >
                <div>
                  <strong>Commande #{c.id}</strong>{' '}
                  <span style={{ color: 'var(--texte-attenue, #888)', fontSize: 13 }}>
                    · Utilisateur #{c.utilisateurId} · {c.montantTotalFcfa} FCFA · {LIBELLES_STATUT_COMMANDE[c.statut] || c.statut} · {new Date(c.dateCommande).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {commandeOuverte === c.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>

              {commandeOuverte === c.id && (
                <div style={{ marginTop: 12, paddingLeft: 12 }}>
                  {(lignesParCommande[c.id] || []).map((ligne) => (
                    <div key={ligne.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <Package size={16} style={{ opacity: 0.6, flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>{ligne.nomProduit} × {ligne.quantite}</span>
                      <span style={{ color: 'var(--texte-attenue, #888)', fontSize: 13 }}>{ligne.prixUnitaireFcfa * ligne.quantite} FCFA</span>
                      <select
                        value={ligne.statutLivraison}
                        onChange={(e) => changerStatutLivraison(ligne, c.id, e.target.value)}
                        disabled={c.statut !== 'PAYEE'}
                        title={c.statut !== 'PAYEE' ? 'Commande pas encore payee' : ''}
                      >
                        {OPTIONS_LIVRAISON.map((o) => <option key={o} value={o}>{LIBELLES_LIVRAISON[o]}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
