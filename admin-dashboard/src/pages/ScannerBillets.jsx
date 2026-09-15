import React, { useState, useRef } from 'react';
import { QrCode, CheckCircle2, XCircle } from 'lucide-react';
import client from '../api/client';

/**
 * Validation des billets a l'entree d'un evenement (section 6.2). Concu
 * pour fonctionner avec un lecteur de code-barres/QR USB classique (tres
 * repandu dans les venues reelles) : ces appareils se comportent comme un
 * clavier et "tapent" le code suivi d'un retour a la ligne - il suffit donc
 * d'un simple champ texte qui se soumet automatiquement des reception
 * d'un Entree, sans necessiter l'acces a la camera (plus fiable qu'un
 * scanner JS embarque, notamment sur les navigateurs/tablettes de salle).
 */
export default function ScannerBillets() {
  const [code, setCode] = useState('');
  const [resultat, setResultat] = useState(null); // { succes, message, billet }
  const [chargement, setChargement] = useState(false);
  const champRef = useRef(null);

  const scanner = async (e) => {
    e.preventDefault();
    const codeQr = code.trim();
    if (!codeQr) return;
    setChargement(true);
    setResultat(null);
    try {
      const { data } = await client.post(`/api/live/billets/scanner/${encodeURIComponent(codeQr)}`);
      setResultat({ succes: true, message: 'Billet valide - entree autorisee', billet: data });
    } catch (err) {
      setResultat({ succes: false, message: err.message || 'Billet refuse' });
    } finally {
      setChargement(false);
      setCode('');
      champRef.current?.focus(); // reste pret a enchainer le scan suivant sans re-cliquer
    }
  };

  return (
    <div className="contenu-principal">
      <div className="entete-page">
        <div><h1>Scanner les billets</h1><p>Validation a l'entree d'un evenement</p></div>
      </div>

      <div className="carte" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', padding: 30 }}>
        <QrCode size={48} style={{ marginBottom: 12, opacity: 0.7 }} />
        <p style={{ fontSize: 13, color: 'var(--texte-attenue, #888)', marginBottom: 20 }}>
          Utilise un lecteur de code-barres USB, ou colle/tape le code manuellement puis valide.
        </p>
        <form onSubmit={scanner}>
          <input
            ref={champRef}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code du billet (ex. MYADD-BILLET-...)"
            style={{ width: '100%', padding: '12px 14px', fontSize: 15, marginBottom: 14, textAlign: 'center' }}
          />
          <button className="bouton" type="submit" disabled={chargement || !code.trim()} style={{ width: '100%', justifyContent: 'center' }}>
            {chargement ? 'Verification...' : 'Valider le billet'}
          </button>
        </form>

        {resultat && (
          <div style={{
            marginTop: 20, padding: 16, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            backgroundColor: resultat.succes ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          }}>
            {resultat.succes ? <CheckCircle2 color="#22C55E" size={32} /> : <XCircle color="#EF4444" size={32} />}
            <strong style={{ color: resultat.succes ? '#22C55E' : '#EF4444' }}>{resultat.message}</strong>
            {resultat.billet && (
              <span style={{ fontSize: 12, color: 'var(--texte-attenue, #888)' }}>
                Categorie {resultat.billet.categorie} · Scanne a {new Date(resultat.billet.dateScan).toLocaleTimeString('fr-FR')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
