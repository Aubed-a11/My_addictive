import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft } from 'lucide-react';
import client from '../api/client';

const PHASES = ['INSCRIPTIONS', 'PRESELECTION', 'ELIMINATIONS', 'FINALE', 'TERMINEE'];
const CATEGORIES = ['MUSIQUE', 'ENTREPRENEURIAT', 'TECH', 'DANSE', 'MODE', 'AUTRE'];
const COMPETITION_VIDE = { nom: '', categorie: 'MUSIQUE', saison: '', phase: 'INSCRIPTIONS', ponderationPublic: 0.5, ponderationJury: 0.5 };
const CANDIDAT_VIDE = { nom: '', ville: '', photoUrl: '', videoUrl: '', statut: 'EN_LICE', noteJury: 0 };

export default function Competitions() {
  const [competitions, setCompetitions] = useState([]);
  const [competitionOuverte, setCompetitionOuverte] = useState(null);
  const [candidats, setCandidats] = useState([]);
  const [chargement, setChargement] = useState(true);

  const [modal, setModal] = useState(null); // 'competition' | 'candidat' | null
  const [enEdition, setEnEdition] = useState(null);
  const [formulaire, setFormulaire] = useState(COMPETITION_VIDE);
  const [erreur, setErreur] = useState(null);

  const chargerCompetitions = async () => {
    setChargement(true);
    try {
      const { data } = await client.get('/api/votes/competitions', { params: { page: 0, size: 50 } });
      setCompetitions(data.content || []);
    } finally {
      setChargement(false);
    }
  };

  const chargerCandidats = async (competitionId) => {
    const { data } = await client.get(`/api/votes/competitions/${competitionId}/candidats`);
    setCandidats(data);
  };

  useEffect(() => { chargerCompetitions(); }, []);

  const ouvrirCompetition = (c) => { setCompetitionOuverte(c); chargerCandidats(c.id); };

  const ouvrirCreationCompetition = () => { setModal('competition'); setEnEdition(null); setFormulaire(COMPETITION_VIDE); setErreur(null); };
  const ouvrirEditionCompetition = (c) => { setModal('competition'); setEnEdition(c); setFormulaire(c); setErreur(null); };
  const ouvrirCreationCandidat = () => { setModal('candidat'); setEnEdition(null); setFormulaire(CANDIDAT_VIDE); setErreur(null); };
  const ouvrirEditionCandidat = (c) => { setModal('candidat'); setEnEdition(c); setFormulaire(c); setErreur(null); };

  const enregistrerCompetition = async () => {
    setErreur(null);
    try {
      if (enEdition) await client.put(`/api/votes/competitions/${enEdition.id}`, formulaire);
      else await client.post('/api/votes/competitions', formulaire);
      setModal(null);
      chargerCompetitions();
    } catch (e) { setErreur(e.message); }
  };

  const enregistrerCandidat = async () => {
    setErreur(null);
    try {
      const corps = { ...formulaire, competitionId: competitionOuverte.id };
      if (enEdition) await client.put(`/api/votes/candidats/${enEdition.id}`, corps);
      else await client.post('/api/votes/candidats', corps);
      setModal(null);
      chargerCandidats(competitionOuverte.id);
    } catch (e) { setErreur(e.message); }
  };

  const supprimerCompetition = async (id) => {
    if (!window.confirm('Supprimer cette competition ?')) return;
    await client.delete(`/api/votes/competitions/${id}`);
    chargerCompetitions();
  };

  const supprimerCandidat = async (id) => {
    if (!window.confirm('Supprimer ce candidat ?')) return;
    await client.delete(`/api/votes/candidats/${id}`);
    chargerCandidats(competitionOuverte.id);
  };

  if (competitionOuverte) {
    return (
      <div className="contenu-principal">
        <div className="entete-page">
          <div>
            <div className="nav-lien" style={{ padding: 0, marginBottom: 8, display: 'inline-flex' }} onClick={() => setCompetitionOuverte(null)}>
              <ChevronLeft size={15} /> Retour aux competitions
            </div>
            <h1>{competitionOuverte.nom}</h1>
            <p>Saison {competitionOuverte.saison} · Phase {competitionOuverte.phase}</p>
          </div>
          <button className="bouton" onClick={ouvrirCreationCandidat}><Plus size={16} /> Ajouter un candidat</button>
        </div>

        <div className="carte">
          {candidats.length === 0 ? <p className="vide">Aucun candidat inscrit.</p> : (
            <table>
              <thead><tr><th>Nom</th><th>Ville</th><th>Statut</th><th>Note jury</th><th></th></tr></thead>
              <tbody>
                {candidats.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nom}</td>
                    <td>{c.ville}</td>
                    <td><span className={`badge ${c.statut === 'EN_LICE' ? 'actif' : 'inactif'}`}>{c.statut}</span></td>
                    <td>{c.noteJury ?? 0}/20</td>
                    <td className="actions-ligne">
                      <button className="icone-action" onClick={() => ouvrirEditionCandidat(c)}><Pencil size={15} /></button>
                      <button className="icone-action" onClick={() => supprimerCandidat(c.id)}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {modal === 'candidat' && (
          <div className="fond-modal" onClick={() => setModal(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>{enEdition ? 'Modifier le candidat' : 'Ajouter un candidat'}</h2>
              <div className="champ"><label>Nom</label><input value={formulaire.nom} onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })} /></div>
              <div className="champ"><label>Ville</label><input value={formulaire.ville} onChange={(e) => setFormulaire({ ...formulaire, ville: e.target.value })} /></div>
              <div className="champ"><label>Photo (URL)</label><input value={formulaire.photoUrl || ''} onChange={(e) => setFormulaire({ ...formulaire, photoUrl: e.target.value })} /></div>
              <div className="champ"><label>Extrait video (URL)</label><input value={formulaire.videoUrl || ''} onChange={(e) => setFormulaire({ ...formulaire, videoUrl: e.target.value })} /></div>
              <div className="ligne-champs">
                <div className="champ">
                  <label>Statut</label>
                  <select value={formulaire.statut} onChange={(e) => setFormulaire({ ...formulaire, statut: e.target.value })}>
                    <option value="EN_LICE">EN_LICE</option>
                    <option value="ELIMINE">ELIMINE</option>
                  </select>
                </div>
                <div className="champ">
                  <label>Note du jury (/20)</label>
                  <input type="number" min="0" max="20" step="0.5" value={formulaire.noteJury ?? 0} onChange={(e) => setFormulaire({ ...formulaire, noteJury: Number(e.target.value) })} />
                </div>
              </div>
              {erreur && <div className="erreur">{erreur}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="bouton secondaire" style={{ flex: 1 }} onClick={() => setModal(null)}>Annuler</button>
                <button className="bouton" style={{ flex: 1, justifyContent: 'center' }} onClick={enregistrerCandidat}>Enregistrer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="contenu-principal">
      <div className="entete-page">
        <div><h1>Competitions & Votes</h1><p>Programmer les phases, gerer les candidats</p></div>
        <button className="bouton" onClick={ouvrirCreationCompetition}><Plus size={16} /> Nouvelle competition</button>
      </div>

      <div className="carte">
        {chargement ? <p className="vide">Chargement...</p> : competitions.length === 0 ? (
          <p className="vide">Aucune competition programmee.</p>
        ) : (
          <table>
            <thead><tr><th>Nom</th><th>Categorie</th><th>Saison</th><th>Phase</th><th></th></tr></thead>
            <tbody>
              {competitions.map((c) => (
                <tr key={c.id}>
                  <td style={{ cursor: 'pointer' }} onClick={() => ouvrirCompetition(c)}>{c.nom}</td>
                  <td>{c.categorie}</td>
                  <td>{c.saison}</td>
                  <td><span className="badge attente">{c.phase}</span></td>
                  <td className="actions-ligne">
                    <button className="icone-action" onClick={() => ouvrirEditionCompetition(c)}><Pencil size={15} /></button>
                    <button className="icone-action" onClick={() => supprimerCompetition(c.id)}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal === 'competition' && (
        <div className="fond-modal" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{enEdition ? 'Modifier la competition' : 'Programmer une competition'}</h2>
            <div className="champ"><label>Nom</label><input value={formulaire.nom} onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })} /></div>
            <div className="ligne-champs">
              <div className="champ">
                <label>Categorie</label>
                <select value={formulaire.categorie} onChange={(e) => setFormulaire({ ...formulaire, categorie: e.target.value })}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="champ"><label>Saison</label><input value={formulaire.saison} onChange={(e) => setFormulaire({ ...formulaire, saison: e.target.value })} /></div>
            </div>
            <div className="champ">
              <label>Phase</label>
              <select value={formulaire.phase} onChange={(e) => setFormulaire({ ...formulaire, phase: e.target.value })}>
                {PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {erreur && <div className="erreur">{erreur}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="bouton secondaire" style={{ flex: 1 }} onClick={() => setModal(null)}>Annuler</button>
              <button className="bouton" style={{ flex: 1, justifyContent: 'center' }} onClick={enregistrerCompetition}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
