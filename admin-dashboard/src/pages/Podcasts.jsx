import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import client from '../api/client';

const PODCAST_VIDE = { titre: '', description: '', editeur: '', imageUrl: '', chaineId: '' };
const EPISODE_VIDE = { titre: '', numeroSaison: 1, numeroEpisode: 1, fichierAudioUrl: '', dureeSecondes: 0 };

/** Gestion des podcasts et de leurs episodes (section 6.4). */
export default function Podcasts() {
  const [podcasts, setPodcasts] = useState([]);
  const [chaines, setChaines] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [podcastOuvert, setPodcastOuvert] = useState(null);
  const [episodes, setEpisodes] = useState([]);

  const [modalPodcastOuvert, setModalPodcastOuvert] = useState(false);
  const [formulairePodcast, setFormulairePodcast] = useState(PODCAST_VIDE);
  const [formulaireEpisode, setFormulaireEpisode] = useState(EPISODE_VIDE);
  const [erreur, setErreur] = useState(null);

  const charger = async () => {
    setChargement(true);
    try {
      const [{ data: p }, { data: c }] = await Promise.all([
        client.get('/api/live/podcasts', { params: { page: 0, size: 50 } }),
        client.get('/api/live/chaines', { params: { page: 0, size: 100 } }),
      ]);
      setPodcasts(p.content || []);
      setChaines(c.content || []);
    } finally { setChargement(false); }
  };
  useEffect(() => { charger(); }, []);

  const ouvrirCreationPodcast = () => { setFormulairePodcast(PODCAST_VIDE); setErreur(null); setModalPodcastOuvert(true); };

  const enregistrerPodcast = async () => {
    setErreur(null);
    try {
      await client.post('/api/live/podcasts', { ...formulairePodcast, chaineId: formulairePodcast.chaineId || null });
      setModalPodcastOuvert(false);
      charger();
    } catch (e) { setErreur(e.message); }
  };

  const supprimerPodcast = async (id) => {
    if (!window.confirm('Supprimer ce podcast et tous ses episodes ?')) return;
    await client.delete(`/api/live/podcasts/${id}`);
    if (podcastOuvert === id) setPodcastOuvert(null);
    charger();
  };

  const basculerEpisodes = async (id) => {
    if (podcastOuvert === id) { setPodcastOuvert(null); return; }
    const { data } = await client.get(`/api/live/podcasts/${id}/episodes`);
    setEpisodes(data);
    setPodcastOuvert(id);
    setFormulaireEpisode(EPISODE_VIDE);
  };

  const ajouterEpisode = async (podcastId) => {
    setErreur(null);
    try {
      await client.post(`/api/live/podcasts/${podcastId}/episodes`, formulaireEpisode);
      const { data } = await client.get(`/api/live/podcasts/${podcastId}/episodes`);
      setEpisodes(data);
      setFormulaireEpisode(EPISODE_VIDE);
    } catch (e) { setErreur(e.message); }
  };

  const supprimerEpisode = async (id, podcastId) => {
    await client.delete(`/api/live/podcasts/episodes/${id}`);
    const { data } = await client.get(`/api/live/podcasts/${podcastId}/episodes`);
    setEpisodes(data);
  };

  return (
    <div className="contenu-principal">
      <div className="entete-page">
        <div><h1>Podcasts</h1><p>Emissions et episodes (section 6.4)</p></div>
        <button className="bouton" onClick={ouvrirCreationPodcast}><Plus size={16} /> Nouveau podcast</button>
      </div>

      <div className="carte">
        {chargement ? <p className="vide">Chargement...</p> : podcasts.length === 0 ? (
          <p className="vide">Aucun podcast pour le moment.</p>
        ) : (
          podcasts.map((p) => (
            <div key={p.id} style={{ borderBottom: '1px solid var(--bordure)', padding: '12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{p.titre}</strong>
                  {p.editeur && <div style={{ color: 'var(--accent, #F5B301)', fontSize: 12 }}>Editeur : {p.editeur}</div>}
                  <div style={{ color: 'var(--texte-attenue)', fontSize: 12 }}>{p.description}</div>
                </div>
                <div className="actions-ligne">
                  <button className="icone-action" onClick={() => basculerEpisodes(p.id)}>
                    {podcastOuvert === p.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  <button className="icone-action" onClick={() => supprimerPodcast(p.id)}><Trash2 size={15} /></button>
                </div>
              </div>

              {podcastOuvert === p.id && (
                <div style={{ marginTop: 12, paddingLeft: 12 }}>
                  {episodes.map((ep) => (
                    <div key={ep.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0' }}>
                      <span>S{ep.numeroSaison} E{ep.numeroEpisode} : {ep.titre}</span>
                      <Trash2 size={14} style={{ cursor: 'pointer' }} onClick={() => supprimerEpisode(ep.id, p.id)} />
                    </div>
                  ))}
                  <div className="ligne-champs" style={{ marginTop: 10 }}>
                    <div className="champ"><label>Titre episode</label><input value={formulaireEpisode.titre} onChange={(e) => setFormulaireEpisode({ ...formulaireEpisode, titre: e.target.value })} /></div>
                    <div className="champ"><label>Saison</label><input type="number" value={formulaireEpisode.numeroSaison} onChange={(e) => setFormulaireEpisode({ ...formulaireEpisode, numeroSaison: Number(e.target.value) })} /></div>
                    <div className="champ"><label>Episode</label><input type="number" value={formulaireEpisode.numeroEpisode} onChange={(e) => setFormulaireEpisode({ ...formulaireEpisode, numeroEpisode: Number(e.target.value) })} /></div>
                  </div>
                  <div className="champ"><label>URL audio</label><input value={formulaireEpisode.fichierAudioUrl} onChange={(e) => setFormulaireEpisode({ ...formulaireEpisode, fichierAudioUrl: e.target.value })} /></div>
                  {erreur && <div className="erreur">{erreur}</div>}
                  <button className="bouton secondaire" onClick={() => ajouterEpisode(p.id)}>+ Ajouter l'episode</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {modalPodcastOuvert && (
        <div className="fond-modal" onClick={() => setModalPodcastOuvert(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nouveau podcast</h2>
            <div className="champ"><label>Titre</label><input value={formulairePodcast.titre} onChange={(e) => setFormulairePodcast({ ...formulairePodcast, titre: e.target.value })} /></div>
            <div className="champ"><label>Description</label><textarea value={formulairePodcast.description} onChange={(e) => setFormulairePodcast({ ...formulairePodcast, description: e.target.value })} /></div>
            <div className="champ"><label>Editeur</label><input value={formulairePodcast.editeur} onChange={(e) => setFormulairePodcast({ ...formulairePodcast, editeur: e.target.value })} placeholder="Nom de la personne ou du studio qui produit ce podcast" /></div>
            <div className="champ"><label>URL de l'image</label><input value={formulairePodcast.imageUrl} onChange={(e) => setFormulairePodcast({ ...formulairePodcast, imageUrl: e.target.value })} /></div>
            <div className="champ">
              <label>Chaine (optionnel)</label>
              <select value={formulairePodcast.chaineId} onChange={(e) => setFormulairePodcast({ ...formulairePodcast, chaineId: e.target.value })}>
                <option value="">Aucune</option>
                {chaines.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            {erreur && <div className="erreur">{erreur}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="bouton secondaire" style={{ flex: 1 }} onClick={() => setModalPodcastOuvert(false)}>Annuler</button>
              <button className="bouton" style={{ flex: 1, justifyContent: 'center' }} onClick={enregistrerPodcast}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
