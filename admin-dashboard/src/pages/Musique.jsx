import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Upload } from 'lucide-react';
import client from '../api/client';

const TITRE_VIDE = { nom: '', artiste: '', genre: '', fichierAudioUrl: '', imageUrl: '', gratuit: true, prixFcfa: 0, youtubeUrl: '', description: '', misEnAvant: false, rangMiseEnAvant: '' };
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
  const [importEnCours, setImportEnCours] = useState(false);
  const [resultatImport, setResultatImport] = useState(null);

  /**
   * Import en masse des genres depuis un fichier CSV a 2 colonnes : id,genre
   * (avec ou sans ligne d'en-tete). Pense pour classer rapidement des
   * centaines/milliers de titres a partir d'un tableur rempli hors ligne,
   * plutot que de devoir ouvrir chaque titre un par un dans ce dashboard.
   */
  const importerGenresCsv = async (fichier) => {
    setImportEnCours(true);
    setResultatImport(null);
    setErreur(null);
    try {
      const texte = await fichier.text();
      const lignes = texte.split('\n').map((l) => l.trim()).filter(Boolean);
      const donnees = lignes
        .map((ligne) => {
          const [idBrut, ...reste] = ligne.split(',');
          const genre = reste.join(',').trim();
          const id = Number(idBrut.trim());
          return { id, genre };
        })
        // Ignore la ligne d'en-tete eventuelle ("id,genre") et toute ligne malformee.
        .filter((l) => Number.isFinite(l.id) && l.genre);
      if (donnees.length === 0) {
        setErreur('Aucune ligne valide trouvee dans le fichier (format attendu : id,genre par ligne).');
        return;
      }
      const { data } = await client.post('/api/musique/titres/importer-genres', donnees);
      setResultatImport(data);
      charger();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setImportEnCours(false);
    }
  };

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
      // Le champ numerique "rang" arrive en chaine vide si laisse tel quel (input HTML) :
      // Jackson ne sait pas convertir "" en Integer cote backend, d'ou cette conversion.
      const corps = { ...formulaire, rangMiseEnAvant: formulaire.rangMiseEnAvant === '' || formulaire.rangMiseEnAvant == null ? null : Number(formulaire.rangMiseEnAvant) };
      if (enEdition) await client.put(`${base}/${enEdition.id}`, corps);
      else await client.post(base, corps);
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
        <div style={{ display: 'flex', gap: 10 }}>
          {onglet === 'titres' && (
            <label className="bouton secondaire" style={{ cursor: 'pointer' }}>
              <Upload size={16} /> {importEnCours ? 'Import en cours...' : 'Importer les genres (CSV)'}
              <input
                type="file"
                accept=".csv,text/csv"
                style={{ display: 'none' }}
                disabled={importEnCours}
                onChange={(e) => { if (e.target.files[0]) importerGenresCsv(e.target.files[0]); e.target.value = ''; }}
              />
            </label>
          )}
          <button className="bouton" onClick={ouvrirCreation}><Plus size={16} /> {onglet === 'titres' ? 'Nouveau titre' : 'Nouvel album'}</button>
        </div>
      </div>
      {resultatImport && (
        <div className="champ" style={{ background: '#eef7ee', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          Import termine : {resultatImport.miseAJour} / {resultatImport.total} titres mis a jour.
          {resultatImport.idsIntrouvables?.length > 0 && (
            <> Identifiants introuvables : {resultatImport.idsIntrouvables.join(', ')}.</>
          )}
        </div>
      )}

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
            <div className="champ">
              <label>URL du clip YouTube (optionnel, pour la section "Brand New" de l'accueil)</label>
              <input value={formulaire.youtubeUrl || ''} onChange={(e) => setFormulaire({ ...formulaire, youtubeUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
            </div>
            <div className="champ">
              <label>Descriptif (affiche sur la fiche du titre - laisser vide pour un texte genere automatiquement)</label>
              <textarea rows={3} value={formulaire.description || ''} onChange={(e) => setFormulaire({ ...formulaire, description: e.target.value })} placeholder="Ex. : Un titre entrainant qui mele afrobeat et sonorites locales..." />
            </div>
            <div className="champ" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                id="misEnAvant"
                checked={!!formulaire.misEnAvant}
                onChange={(e) => setFormulaire({ ...formulaire, misEnAvant: e.target.checked })}
              />
              <label htmlFor="misEnAvant" style={{ margin: 0 }}>
                Mettre en avant dans les Tops (streaming, telechargement, ventes), en plus du classement automatique
              </label>
            </div>
            {formulaire.misEnAvant && (
              <div className="champ">
                <label>Rang parmi les titres mis en avant (1 = tout en haut ; laisser vide pour ne pas prioriser entre eux)</label>
                <input
                  type="number"
                  value={formulaire.rangMiseEnAvant || ''}
                  onChange={(e) => setFormulaire({ ...formulaire, rangMiseEnAvant: e.target.value })}
                  placeholder="Ex. : 1"
                />
              </div>
            )}
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
