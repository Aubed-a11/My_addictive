import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import client from '../api/client';

const VIDE = { nom: '', description: '', categorie: 'MODE', prixFcfa: 0, stock: 0, imageUrl: '', vendeurId: 1, dropLimite: false, dateDebutDrop: '' };

/** Gestion du catalogue boutique par l'administration (publie directement pour n'importe quel vendeur). */
export default function Boutique() {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState(null);
  const [formulaire, setFormulaire] = useState(VIDE);
  const [erreur, setErreur] = useState(null);

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await client.get('/api/boutique/produits', { params: { page: 0, size: 50 } });
      setProduits(data.content || []);
    } finally { setChargement(false); }
  };
  useEffect(() => { charger(); }, []);

  const ouvrirCreation = () => { setEnEdition(null); setFormulaire(VIDE); setErreur(null); setModalOuvert(true); };
  const ouvrirEdition = (p) => {
    setEnEdition(p);
    setFormulaire({ ...p, dateDebutDrop: p.dateDebutDrop ? p.dateDebutDrop.slice(0, 16) : '' });
    setErreur(null);
    setModalOuvert(true);
  };

  const enregistrer = async () => {
    setErreur(null);
    try {
      const corps = { ...formulaire, dateDebutDrop: formulaire.dateDebutDrop ? new Date(formulaire.dateDebutDrop).toISOString() : null };
      if (enEdition) await client.put(`/api/boutique/produits/${enEdition.id}`, corps);
      else await client.post('/api/boutique/produits/admin', corps);
      setModalOuvert(false);
      charger();
    } catch (e) { setErreur(e.message); }
  };

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    await client.delete(`/api/boutique/produits/${id}`);
    charger();
  };

  return (
    <div className="contenu-principal">
      <div className="entete-page">
        <div><h1>Boutique</h1><p>Catalogue produits multi-vendeurs</p></div>
        <button className="bouton" onClick={ouvrirCreation}><Plus size={16} /> Nouveau produit</button>
      </div>

      <div className="carte">
        {chargement ? <p className="vide">Chargement...</p> : produits.length === 0 ? (
          <p className="vide">Aucun produit publie.</p>
        ) : (
          <table>
            <thead><tr><th>Nom</th><th>Categorie</th><th>Prix</th><th>Stock</th><th></th></tr></thead>
            <tbody>
              {produits.map((p) => (
                <tr key={p.id}>
                  <td>{p.nom}</td><td>{p.categorie}</td><td>{p.prixFcfa} FCFA</td>
                  <td><span className={`badge ${p.stock > 0 ? 'actif' : 'inactif'}`}>{p.stock}</span></td>
                  <td className="actions-ligne">
                    <button className="icone-action" onClick={() => ouvrirEdition(p)}><Pencil size={15} /></button>
                    <button className="icone-action" onClick={() => supprimer(p.id)}><Trash2 size={15} /></button>
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
            <h2>{enEdition ? 'Modifier le produit' : 'Nouveau produit'}</h2>
            <div className="champ"><label>Nom</label><input value={formulaire.nom} onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })} /></div>
            <div className="champ"><label>Description</label><textarea value={formulaire.description || ''} onChange={(e) => setFormulaire({ ...formulaire, description: e.target.value })} /></div>
            <div className="ligne-champs">
              <div className="champ"><label>Prix (FCFA)</label><input type="number" value={formulaire.prixFcfa} onChange={(e) => setFormulaire({ ...formulaire, prixFcfa: Number(e.target.value) })} /></div>
              <div className="champ"><label>Stock</label><input type="number" value={formulaire.stock} onChange={(e) => setFormulaire({ ...formulaire, stock: Number(e.target.value) })} /></div>
            </div>
            <div className="ligne-champs">
              <div className="champ">
                <label>Categorie</label>
                <select value={formulaire.categorie} onChange={(e) => setFormulaire({ ...formulaire, categorie: e.target.value })}>
                  {['MODE', 'HIGH_TECH', 'MAISON', 'BEAUTE', 'ALIMENTATION', 'ARTISANAT', 'MUSIQUE', 'AUTRE'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="champ"><label>ID vendeur</label><input type="number" value={formulaire.vendeurId || 1} onChange={(e) => setFormulaire({ ...formulaire, vendeurId: Number(e.target.value) })} /></div>
            </div>
            <div className="champ"><label>URL de l'image</label><input value={formulaire.imageUrl || ''} onChange={(e) => setFormulaire({ ...formulaire, imageUrl: e.target.value })} /></div>
            <div className="ligne-champs">
              <div className="champ">
                <label>Drop limite</label>
                <select value={formulaire.dropLimite ? 'oui' : 'non'} onChange={(e) => setFormulaire({ ...formulaire, dropLimite: e.target.value === 'oui' })}>
                  <option value="non">Non</option>
                  <option value="oui">Oui</option>
                </select>
              </div>
              {formulaire.dropLimite && (
                <div className="champ">
                  <label>Disponible a partir de</label>
                  <input type="datetime-local" value={formulaire.dateDebutDrop || ''} onChange={(e) => setFormulaire({ ...formulaire, dateDebutDrop: e.target.value })} />
                </div>
              )}
            </div>
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
