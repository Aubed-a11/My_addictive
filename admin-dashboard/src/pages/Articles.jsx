import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import client from '../api/client';

const VIDE = { titre: '', chapo: '', contenu: '', imageUrl: '', categorie: 'ACTUALITE', aLaUne: false, statut: 'PUBLIE' };

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState(null);
  const [formulaire, setFormulaire] = useState(VIDE);
  const [erreur, setErreur] = useState(null);

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await client.get('/api/media/articles', { params: { page: 0, size: 50 } });
      setArticles(data.content || []);
    } finally { setChargement(false); }
  };
  useEffect(() => { charger(); }, []);

  const ouvrirCreation = () => { setEnEdition(null); setFormulaire(VIDE); setErreur(null); setModalOuvert(true); };
  const ouvrirEdition = (a) => { setEnEdition(a); setFormulaire(a); setErreur(null); setModalOuvert(true); };

  const enregistrer = async () => {
    setErreur(null);
    try {
      if (enEdition) await client.put(`/api/media/articles/${enEdition.id}`, formulaire);
      else await client.post('/api/media/articles', formulaire);
      setModalOuvert(false);
      charger();
    } catch (e) { setErreur(e.message); }
  };

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cet article ?')) return;
    await client.delete(`/api/media/articles/${id}`);
    charger();
  };

  return (
    <div className="contenu-principal">
      <div className="entete-page">
        <div><h1>Media & actualites</h1><p>Publier et gerer les articles</p></div>
        <button className="bouton" onClick={ouvrirCreation}><Plus size={16} /> Nouvel article</button>
      </div>

      <div className="carte">
        {chargement ? <p className="vide">Chargement...</p> : articles.length === 0 ? (
          <p className="vide">Aucun article publie.</p>
        ) : (
          <table>
            <thead><tr><th>Titre</th><th>Categorie</th><th>Vues</th><th>A la une</th><th></th></tr></thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>{a.titre}</td>
                  <td>{a.categorie}</td>
                  <td>{a.compteurVues}</td>
                  <td>{a.aLaUne ? <span className="badge actif">Oui</span> : 'Non'}</td>
                  <td className="actions-ligne">
                    <button className="icone-action" onClick={() => ouvrirEdition(a)}><Pencil size={15} /></button>
                    <button className="icone-action" onClick={() => supprimer(a.id)}><Trash2 size={15} /></button>
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
            <h2>{enEdition ? "Modifier l'article" : 'Nouvel article'}</h2>
            <div className="champ"><label>Titre</label><input value={formulaire.titre} onChange={(e) => setFormulaire({ ...formulaire, titre: e.target.value })} /></div>
            <div className="champ"><label>Chapo</label><input value={formulaire.chapo || ''} onChange={(e) => setFormulaire({ ...formulaire, chapo: e.target.value })} /></div>
            <div className="champ"><label>Contenu</label><textarea value={formulaire.contenu || ''} onChange={(e) => setFormulaire({ ...formulaire, contenu: e.target.value })} /></div>
            <div className="champ"><label>URL de l'image</label><input value={formulaire.imageUrl || ''} onChange={(e) => setFormulaire({ ...formulaire, imageUrl: e.target.value })} /></div>
            <div className="ligne-champs">
              <div className="champ">
                <label>Categorie</label>
                <select value={formulaire.categorie} onChange={(e) => setFormulaire({ ...formulaire, categorie: e.target.value })}>
                  <option value="ACTUALITE">ACTUALITE</option>
                  <option value="SHOWBIZ">SHOWBIZ</option>
                  <option value="VIDEO">VIDEO</option>
                </select>
              </div>
              <div className="champ">
                <label>A la une</label>
                <select value={formulaire.aLaUne ? 'oui' : 'non'} onChange={(e) => setFormulaire({ ...formulaire, aLaUne: e.target.value === 'oui' })}>
                  <option value="non">Non</option>
                  <option value="oui">Oui</option>
                </select>
              </div>
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
