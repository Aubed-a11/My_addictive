import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import client from '../api/client';

const TITRE_VIDE = { nom: '', artiste: '', genre: '', fichierAudioUrl: '', imageUrl: '', gratuit: true, prixFcfa: 0 };
const ALBUM_VIDE = { titre: '', artiste: '', genre: '', imageUrl: '', dateSortie: '' };

export default function Musique() {
  const [onglet, setOnglet] = useState('titres');
  const [titres, setTitres] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState(null);
  const [formulaire, setFormulaire] = useState(TITRE_VIDE);
  const [erreur, setErreur] = useState(null);

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await client.get(onglet === 'titres' ? '/api/musique/titres' : '/api/musique/albums', { params: { page: 0, size: 50 } });
      if (onglet === 'titres') setTitres(data.content || []); else setAlbums(data.content || []);
    } finally { setChargement(false); }
  };
  useEffect(() => { charger(); }, [onglet]);

  const ouvrirCreation = () => { setEnEdition(null); setFormulaire(onglet === 'titres' ? TITRE_VIDE : ALBUM_VIDE); setErreur(null); setModalOuvert(true); };
  const ouvrirEdition = (item) => { setEnEdition(item); setFormulaire(item); setErreur(null); setModalOuvert(true); };

  const enregistrer = async () => {
    setErreur(null);
    try {
      const base = onglet === 'titres' ? '/api/musique/titres' : '/api/musique/albums';
      if (enEdition) await client.put(`${base}/${enEdition.id}`, formulaire);
      else await client.post(base, formulaire);
      setModalOuvert(false);
      charger();
    } catch (e) { setErreur(e.message); }
  };

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cet element ?')) return;
    await client.delete(`${onglet === 'titres' ? '/api/musique/titres' : '/api/musique/albums'}/${id}`);
    charger();
  };

  const items = onglet === 'titres' ? titres : albums;

  return (
    <div className="contenu-principal">
      <div className="entete-page">
        <div><h1>Musique</h1><p>Publier des titres et des albums</p></div>
        <button className="bouton" onClick={ouvrirCreation}><Plus size={16} /> {onglet === 'titres' ? 'Nouveau titre' : 'Nouvel album'}</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`bouton ${onglet === 'titres' ? '' : 'secondaire'}`} onClick={() => setOnglet('titres')}>Titres</button>
        <button className={`bouton ${onglet === 'albums' ? '' : 'secondaire'}`} onClick={() => setOnglet('albums')}>Albums</button>
      </div>

      <div className="carte">
        {chargement ? <p className="vide">Chargement...</p> : items.length === 0 ? (
          <p className="vide">Rien a afficher.</p>
        ) : onglet === 'titres' ? (
          <table>
            <thead><tr><th>Nom</th><th>Artiste</th><th>Genre</th><th>Prix</th><th></th></tr></thead>
            <tbody>
              {titres.map((t) => (
                <tr key={t.id}>
                  <td>{t.nom}</td><td>{t.artiste}</td><td>{t.genre}</td>
                  <td>{t.gratuit ? 'Gratuit' : `${t.prixFcfa} FCFA`}</td>
                  <td className="actions-ligne">
                    <button className="icone-action" onClick={() => ouvrirEdition(t)}><Pencil size={15} /></button>
                    <button className="icone-action" onClick={() => supprimer(t.id)}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table>
            <thead><tr><th>Titre</th><th>Artiste</th><th>Genre</th><th>Sortie</th><th></th></tr></thead>
            <tbody>
              {albums.map((a) => (
                <tr key={a.id}>
                  <td>{a.titre}</td><td>{a.artiste}</td><td>{a.genre}</td><td>{a.dateSortie}</td>
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

      {modalOuvert && onglet === 'titres' && (
        <div className="fond-modal" onClick={() => setModalOuvert(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{enEdition ? 'Modifier le titre' : 'Nouveau titre'}</h2>
            <div className="champ"><label>Nom</label><input value={formulaire.nom} onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })} /></div>
            <div className="champ"><label>Artiste</label><input value={formulaire.artiste} onChange={(e) => setFormulaire({ ...formulaire, artiste: e.target.value })} /></div>
            <div className="champ"><label>Genre</label><input value={formulaire.genre || ''} onChange={(e) => setFormulaire({ ...formulaire, genre: e.target.value })} /></div>
            <div className="champ"><label>URL du fichier audio</label><input value={formulaire.fichierAudioUrl || ''} onChange={(e) => setFormulaire({ ...formulaire, fichierAudioUrl: e.target.value })} /></div>
            <div className="ligne-champs">
              <div className="champ">
                <label>Gratuit</label>
                <select value={formulaire.gratuit ? 'oui' : 'non'} onChange={(e) => setFormulaire({ ...formulaire, gratuit: e.target.value === 'oui' })}>
                  <option value="oui">Oui</option><option value="non">Non</option>
                </select>
              </div>
              {!formulaire.gratuit && (
                <div className="champ"><label>Prix (FCFA)</label><input type="number" value={formulaire.prixFcfa || 0} onChange={(e) => setFormulaire({ ...formulaire, prixFcfa: Number(e.target.value) })} /></div>
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

      {modalOuvert && onglet === 'albums' && (
        <div className="fond-modal" onClick={() => setModalOuvert(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{enEdition ? "Modifier l'album" : 'Nouvel album'}</h2>
            <div className="champ"><label>Titre</label><input value={formulaire.titre} onChange={(e) => setFormulaire({ ...formulaire, titre: e.target.value })} /></div>
            <div className="champ"><label>Artiste</label><input value={formulaire.artiste} onChange={(e) => setFormulaire({ ...formulaire, artiste: e.target.value })} /></div>
            <div className="champ"><label>Genre</label><input value={formulaire.genre || ''} onChange={(e) => setFormulaire({ ...formulaire, genre: e.target.value })} /></div>
            <div className="champ"><label>Date de sortie</label><input value={formulaire.dateSortie || ''} onChange={(e) => setFormulaire({ ...formulaire, dateSortie: e.target.value })} placeholder="2026" /></div>
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
