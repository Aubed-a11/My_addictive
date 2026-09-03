import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import client from '../api/client';

const VIDE = { nom: '', description: '', imageUrl: '' };

/** Gestion des chaines (organisateurs/artistes) : sert de conteneur aux evenements, podcasts et fan club. */
export default function Chaines() {
  const [chaines, setChaines] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState(null);
  const [formulaire, setFormulaire] = useState(VIDE);
  const [erreur, setErreur] = useState(null);

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await client.get('/api/live/chaines', { params: { page: 0, size: 50 } });
      setChaines(data.content || []);
    } finally { setChargement(false); }
  };
  useEffect(() => { charger(); }, []);

  const ouvrirCreation = () => { setEnEdition(null); setFormulaire(VIDE); setErreur(null); setModalOuvert(true); };
  const ouvrirEdition = (c) => { setEnEdition(c); setFormulaire(c); setErreur(null); setModalOuvert(true); };

  const enregistrer = async () => {
    setErreur(null);
    try {
      if (enEdition) await client.put(`/api/live/chaines/${enEdition.id}`, formulaire);
      else await client.post('/api/live/chaines', formulaire);
      setModalOuvert(false);
      charger();
    } catch (e) { setErreur(e.message); }
  };

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cette chaine ?')) return;
    await client.delete(`/api/live/chaines/${id}`);
    charger();
  };

  return (
    <div className="contenu-principal">
      <div className="entete-page">
        <div><h1>Chaines</h1><p>Organisateurs et artistes : conteneur des evenements, podcasts et fan club</p></div>
        <button className="bouton" onClick={ouvrirCreation}><Plus size={16} /> Nouvelle chaine</button>
      </div>

      <div className="carte">
        {chargement ? <p className="vide">Chargement...</p> : chaines.length === 0 ? (
          <p className="vide">Aucune chaine pour le moment.</p>
        ) : (
          <table>
            <thead><tr><th>Nom</th><th>Abonnes</th><th></th></tr></thead>
            <tbody>
              {chaines.map((c) => (
                <tr key={c.id}>
                  <td>{c.nom}</td>
                  <td>{c.nombreAbonnes}</td>
                  <td className="actions-ligne">
                    <button className="icone-action" onClick={() => ouvrirEdition(c)}><Pencil size={15} /></button>
                    <button className="icone-action" onClick={() => supprimer(c.id)}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOuvert && (
        <div className="fond-modal" onClick={() => setModalOuvert(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{enEdition ? 'Modifier la chaine' : 'Nouvelle chaine'}</h2>
            <div className="champ"><label>Nom</label><input value={formulaire.nom} onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })} /></div>
            <div className="champ"><label>Description</label><textarea value={formulaire.description || ''} onChange={(e) => setFormulaire({ ...formulaire, description: e.target.value })} /></div>
            <div className="champ"><label>URL de l'image</label><input value={formulaire.imageUrl || ''} onChange={(e) => setFormulaire({ ...formulaire, imageUrl: e.target.value })} /></div>
            {erreur && <div className="erreur">{erreur}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="bouton secondaire" style={{ flex: 1 }} onClick={() => setModalOuvert(false)}>Annuler</button>
              <button className="bouton" style={{ flex: 1, justifyContent: 'center' }} onClick={enregistrer}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
