import React, { useEffect, useState } from 'react';
import { Check, X, Ban } from 'lucide-react';
import client from '../api/client';

const FILTRES = [
  { valeur: '', label: 'Tous' },
  { valeur: 'EN_ATTENTE', label: 'En attente' },
  { valeur: 'VALIDE', label: 'Valides' },
  { valeur: 'REFUSE', label: 'Refuses' },
  { valeur: 'SUSPENDU', label: 'Suspendus' },
];

/** Validation des demandes d'ouverture de boutique (section 8.1 du cahier des charges). */
export default function Vendeurs() {
  const [vendeurs, setVendeurs] = useState([]);
  const [filtre, setFiltre] = useState('EN_ATTENTE');
  const [chargement, setChargement] = useState(true);

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await client.get('/api/boutique/vendeurs/admin', { params: { statut: filtre || undefined, page: 0, size: 50 } });
      setVendeurs(data.content || []);
    } finally { setChargement(false); }
  };
  useEffect(() => { charger(); }, [filtre]);

  const changerStatut = async (id, statut) => {
    await client.put(`/api/boutique/vendeurs/${id}/statut`, null, { params: { statut } });
    charger();
  };

  return (
    <div className="contenu-principal">
      <div className="entete-page">
        <div><h1>Vendeurs</h1><p>Valider les demandes d'ouverture de boutique</p></div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {FILTRES.map((f) => (
          <button key={f.valeur} className={`bouton ${filtre === f.valeur ? '' : 'secondaire'}`} onClick={() => setFiltre(f.valeur)}>{f.label}</button>
        ))}
      </div>

      <div className="carte">
        {chargement ? <p className="vide">Chargement...</p> : vendeurs.length === 0 ? (
          <p className="vide">Aucune boutique pour ce filtre.</p>
        ) : (
          <table>
            <thead><tr><th>Boutique</th><th>Categorie</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              {vendeurs.map((v) => (
                <tr key={v.id}>
                  <td>{v.nomBoutique}</td>
                  <td>{v.categorie}</td>
                  <td><span className={`badge ${v.statut === 'VALIDE' ? 'actif' : v.statut === 'EN_ATTENTE' ? 'attente' : 'inactif'}`}>{v.statut}</span></td>
                  <td className="actions-ligne">
                    {v.statut !== 'VALIDE' && (
                      <button className="icone-action" title="Valider" onClick={() => changerStatut(v.id, 'VALIDE')}><Check size={15} /></button>
                    )}
                    {v.statut !== 'REFUSE' && (
                      <button className="icone-action" title="Refuser" onClick={() => changerStatut(v.id, 'REFUSE')}><X size={15} /></button>
                    )}
                    {v.statut === 'VALIDE' && (
                      <button className="icone-action" title="Suspendre" onClick={() => changerStatut(v.id, 'SUSPENDU')}><Ban size={15} /></button>
                    )}
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
