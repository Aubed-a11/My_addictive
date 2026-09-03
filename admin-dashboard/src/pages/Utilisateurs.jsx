import React, { useEffect, useState } from 'react';
import client from '../api/client';

const ROLES = ['VISITEUR', 'MEMBRE', 'ARTISTE', 'ORGANISATEUR', 'VENDEUR', 'CANDIDAT', 'JURY', 'ADMINISTRATEUR'];

/** Gestion des roles utilisateurs (ex. promouvoir un membre en ORGANISATEUR pour l'auto-service d'evenements). */
export default function Utilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await client.get('/api/compte/admin/utilisateurs');
      setUtilisateurs(data);
    } finally {
      setChargement(false);
    }
  };
  useEffect(() => { charger(); }, []);

  const changerRole = async (id, nouveauRole) => {
    await client.put(`/api/compte/admin/utilisateurs/${id}/role`, null, { params: { nouveauRole } });
    charger();
  };

  return (
    <div className="contenu-principal">
      <div className="entete-page">
        <div><h1>Utilisateurs</h1><p>Attribuer des roles (ex. Organisateur pour l'auto-service d'evenements)</p></div>
      </div>

      <div className="carte">
        {chargement ? <p className="vide">Chargement...</p> : utilisateurs.length === 0 ? (
          <p className="vide">Aucun utilisateur.</p>
        ) : (
          <table>
            <thead><tr><th>Nom</th><th>Email</th><th>Role actuel</th><th>Changer le role</th></tr></thead>
            <tbody>
              {utilisateurs.map((u) => (
                <tr key={u.id}>
                  <td>{u.nomComplet || '(sans nom)'}</td>
                  <td>{u.email}</td>
                  <td><span className="badge attente">{u.role}</span></td>
                  <td>
                    <select value={u.role} onChange={(e) => changerRole(u.id, e.target.value)}>
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
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
