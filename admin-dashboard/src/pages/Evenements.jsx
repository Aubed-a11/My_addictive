import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, BarChart2, X } from 'lucide-react';
import client from '../api/client';

const STATUTS = ['A_VENIR', 'EN_DIRECT', 'REPLAY', 'TERMINE'];

const VIDE = {
  titre: '', lieu: '', imageUrl: '', dateDebut: '', statut: 'A_VENIR', chaineId: '',
  payant: true, prixStandardFcfa: 5000, prixVipFcfa: 15000, urlFlux: '', urlReplay: '',
};

/** Gestion des evenements (creation, programmation, edition, suppression) — reserve aux administrateurs. */
export default function Evenements() {
  const [evenements, setEvenements] = useState([]);
  const [chaines, setChaines] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [enEdition, setEnEdition] = useState(null);
  const [formulaire, setFormulaire] = useState(VIDE);
  const [erreur, setErreur] = useState(null);

  const [evenementSondages, setEvenementSondages] = useState(null); // evenement ouvert pour gerer ses sondages
  const [sondages, setSondages] = useState([]);
  const [nouvelleQuestion, setNouvelleQuestion] = useState('');
  const [nouvellesOptions, setNouvellesOptions] = useState(['', '']);

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await client.get('/api/live/evenements', { params: { page: 0, size: 50 } });
      setEvenements(data.content || []);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
    client.get('/api/live/chaines', { params: { page: 0, size: 100 } }).then(({ data }) => setChaines(data.content || []));
  }, []);

  const ouvrirCreation = () => { setEnEdition(null); setFormulaire(VIDE); setErreur(null); setModalOuvert(true); };
  const ouvrirEdition = (e) => {
    setEnEdition(e);
    setFormulaire({ ...e, dateDebut: e.dateDebut ? e.dateDebut.slice(0, 16) : '' });
    setErreur(null);
    setModalOuvert(true);
  };

  const enregistrer = async () => {
    setErreur(null);
    try {
      const corps = {
        ...formulaire,
        dateDebut: formulaire.dateDebut ? new Date(formulaire.dateDebut).toISOString() : null,
        chaineId: formulaire.chaineId || null,
      };
      if (enEdition) {
        await client.put(`/api/live/evenements/${enEdition.id}`, corps);
      } else {
        await client.post('/api/live/evenements', corps);
      }
      setModalOuvert(false);
      charger();
    } catch (e) {
      setErreur(e.message);
    }
  };

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cet evenement ?')) return;
    await client.delete(`/api/live/evenements/${id}`);
    charger();
  };

  const ouvrirSondages = async (evenement) => {
    setEvenementSondages(evenement);
    setNouvelleQuestion('');
    setNouvellesOptions(['', '']);
    const { data } = await client.get(`/api/live/evenements/${evenement.id}/sondages`);
    setSondages(data);
  };

  const creerSondage = async () => {
    const options = nouvellesOptions.map((o) => o.trim()).filter(Boolean);
    if (!nouvelleQuestion.trim() || options.length < 2) return;
    await client.post(`/api/live/evenements/${evenementSondages.id}/sondages`, { question: nouvelleQuestion.trim(), options });
    const { data } = await client.get(`/api/live/evenements/${evenementSondages.id}/sondages`);
    setSondages(data);
    setNouvelleQuestion('');
    setNouvellesOptions(['', '']);
  };

  const cloturerSondage = async (id) => {
    await client.put(`/api/live/sondages/${id}/cloturer`);
    const { data } = await client.get(`/api/live/evenements/${evenementSondages.id}/sondages`);
    setSondages(data);
  };

  return (
    <div className="contenu-principal">
      <div className="entete-page">
        <div>
          <h1>Evenements</h1>
          <p>Creer, programmer et gerer la billetterie/live</p>
        </div>
        <button className="bouton" onClick={ouvrirCreation}><Plus size={16} /> Programmer un evenement</button>
      </div>

      <div className="carte">
        {chargement ? (
          <p className="vide">Chargement...</p>
        ) : evenements.length === 0 ? (
          <p className="vide">Aucun evenement pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Titre</th><th>Lieu</th><th>Date</th><th>Statut</th><th>Payant</th><th></th></tr>
            </thead>
            <tbody>
              {evenements.map((e) => (
                <tr key={e.id}>
                  <td>{e.titre}</td>
                  <td>{e.lieu}</td>
                  <td>{e.dateDebut ? new Date(e.dateDebut).toLocaleString('fr-FR') : '—'}</td>
                  <td><span className={`badge ${e.statut === 'EN_DIRECT' ? 'inactif' : e.statut === 'A_VENIR' ? 'attente' : 'actif'}`}>{e.statut}</span></td>
                  <td>{e.payant ? 'Oui' : 'Non'}</td>
                  <td className="actions-ligne">
                    <button className="icone-action" title="Sondages" onClick={() => ouvrirSondages(e)}><BarChart2 size={15} /></button>
                    <button className="icone-action" onClick={() => ouvrirEdition(e)}><Pencil size={15} /></button>
                    <button className="icone-action" onClick={() => supprimer(e.id)}><Trash2 size={15} /></button>
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
            <h2>{enEdition ? "Modifier l'evenement" : 'Programmer un evenement'}</h2>

            <div className="champ">
              <label>Titre</label>
              <input value={formulaire.titre} onChange={(e) => setFormulaire({ ...formulaire, titre: e.target.value })} />
            </div>
            <div className="ligne-champs">
              <div className="champ">
                <label>Lieu</label>
                <input value={formulaire.lieu} onChange={(e) => setFormulaire({ ...formulaire, lieu: e.target.value })} />
              </div>
              <div className="champ">
                <label>Date et heure de debut</label>
                <input type="datetime-local" value={formulaire.dateDebut} onChange={(e) => setFormulaire({ ...formulaire, dateDebut: e.target.value })} />
              </div>
            </div>
            <div className="champ">
              <label>URL de l'image</label>
              <input value={formulaire.imageUrl || ''} onChange={(e) => setFormulaire({ ...formulaire, imageUrl: e.target.value })} />
            </div>
            <div className="champ">
              <label>Chaine (optionnel)</label>
              <select value={formulaire.chaineId || ''} onChange={(e) => setFormulaire({ ...formulaire, chaineId: e.target.value })}>
                <option value="">Aucune</option>
                {chaines.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div className="ligne-champs">
              <div className="champ">
                <label>Statut</label>
                <select value={formulaire.statut} onChange={(e) => setFormulaire({ ...formulaire, statut: e.target.value })}>
                  {STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="champ">
                <label>Payant</label>
                <select value={formulaire.payant ? 'oui' : 'non'} onChange={(e) => setFormulaire({ ...formulaire, payant: e.target.value === 'oui' })}>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                </select>
              </div>
            </div>
            {formulaire.payant && (
              <div className="ligne-champs">
                <div className="champ">
                  <label>Prix standard (FCFA)</label>
                  <input type="number" value={formulaire.prixStandardFcfa || ''} onChange={(e) => setFormulaire({ ...formulaire, prixStandardFcfa: Number(e.target.value) })} />
                </div>
                <div className="champ">
                  <label>Prix VIP (FCFA)</label>
                  <input type="number" value={formulaire.prixVipFcfa || ''} onChange={(e) => setFormulaire({ ...formulaire, prixVipFcfa: Number(e.target.value) })} />
                </div>
              </div>
            )}
            <div className="champ">
              <label>URL du flux en direct (optionnel)</label>
              <input value={formulaire.urlFlux || ''} onChange={(e) => setFormulaire({ ...formulaire, urlFlux: e.target.value })} />
            </div>

            {erreur && <div className="erreur">{erreur}</div>}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="bouton secondaire" onClick={() => setModalOuvert(false)} style={{ flex: 1 }}>Annuler</button>
              <button className="bouton" onClick={enregistrer} style={{ flex: 1, justifyContent: 'center' }}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {evenementSondages && (
        <div className="fond-modal" onClick={() => setEvenementSondages(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Sondages — {evenementSondages.titre}</h2>
              <button className="icone-action" onClick={() => setEvenementSondages(null)}><X size={18} /></button>
            </div>

            {sondages.length === 0 && <p className="vide">Aucun sondage pour cet evenement.</p>}
            {sondages.map((s) => (
              <div key={s.sondageId} className="carte" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong>{s.question}</strong>
                  {s.actif ? (
                    <button className="bouton secondaire" onClick={() => cloturerSondage(s.sondageId)}>Cloturer</button>
                  ) : (
                    <span className="badge inactif">Cloture</span>
                  )}
                </div>
                {s.options.map((o) => (
                  <div key={o.optionId} style={{ fontSize: 13, color: 'var(--texte-attenue)', marginBottom: 4 }}>
                    {o.texte} — {o.votes} votes ({o.pourcentage.toFixed(0)}%)
                  </div>
                ))}
              </div>
            ))}

            <h3 style={{ fontSize: 14, marginTop: 20, marginBottom: 10 }}>Nouveau sondage</h3>
            <div className="champ">
              <label>Question</label>
              <input value={nouvelleQuestion} onChange={(e) => setNouvelleQuestion(e.target.value)} placeholder="Qui doit remporter ce concert ?" />
            </div>
            {nouvellesOptions.map((opt, i) => (
              <div className="champ" key={i}>
                <label>Option {i + 1}</label>
                <input
                  value={opt}
                  onChange={(e) => {
                    const copie = [...nouvellesOptions];
                    copie[i] = e.target.value;
                    setNouvellesOptions(copie);
                  }}
                />
              </div>
            ))}
            <button className="bouton secondaire" style={{ marginBottom: 14 }} onClick={() => setNouvellesOptions([...nouvellesOptions, ''])}>
              + Ajouter une option
            </button>
            <button className="bouton" style={{ width: '100%', justifyContent: 'center' }} onClick={creerSondage}>
              Lancer le sondage
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
