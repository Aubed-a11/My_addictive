import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Trophy, Newspaper, ShoppingBag } from 'lucide-react';
import client from '../api/client';

/**
 * Page d'accueil du back-office : met en avant les evenements a venir en
 * premier (a la maniere d'une page d'accueil Gozem-like centree sur les
 * evenements), avec un rappel des volumes des autres rubriques.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const [evenements, setEvenements] = useState([]);
  const [stats, setStats] = useState({ articles: 0, competitions: 0, produits: 0 });
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: ev }, { data: articles }, { data: competitions }, { data: produits }] = await Promise.all([
          client.get('/api/live/evenements', { params: { statut: 'A_VENIR', page: 0, size: 6 } }),
          client.get('/api/media/articles', { params: { page: 0, size: 1 } }),
          client.get('/api/votes/competitions', { params: { page: 0, size: 1 } }),
          client.get('/api/boutique/produits', { params: { page: 0, size: 1 } }),
        ]);
        setEvenements(ev.content || []);
        setStats({
          articles: articles.totalElements ?? 0,
          competitions: competitions.totalElements ?? 0,
          produits: produits.totalElements ?? 0,
        });
      } catch {
        // Back-office reste utilisable meme si le backend est injoignable au chargement.
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  return (
    <div className="contenu-principal">
      <div className="entete-page">
        <div>
          <h1>Tableau de bord</h1>
          <p>Vue d'ensemble et evenements a venir</p>
        </div>
        <button className="bouton" onClick={() => navigate('/evenements')}>+ Programmer un evenement</button>
      </div>

      <div className="grille-stats">
        <div className="carte">
          <div className="stat-valeur">{evenements.length}</div>
          <div className="stat-label"><Ticket size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Evenements a venir</div>
        </div>
        <div className="carte">
          <div className="stat-valeur">{stats.competitions}</div>
          <div className="stat-label"><Trophy size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Competitions</div>
        </div>
        <div className="carte">
          <div className="stat-valeur">{stats.articles}</div>
          <div className="stat-label"><Newspaper size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Articles publies</div>
        </div>
        <div className="carte">
          <div className="stat-valeur">{stats.produits}</div>
          <div className="stat-label"><ShoppingBag size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />Produits en boutique</div>
        </div>
      </div>

      <h2 className="section-titre">Evenements a venir</h2>
      {chargement && <p className="vide">Chargement...</p>}
      {!chargement && evenements.length === 0 && (
        <p className="vide">Aucun evenement programme. Cliquez sur "Programmer un evenement" pour en creer un.</p>
      )}
      <div className="grille-evenements">
        {evenements.map((e) => (
          <div key={e.id} className="carte-evenement" onClick={() => navigate('/evenements')}>
            <div className="image" />
            <div className="corps">
              <span className="statut">{e.statut}</span>
              <h3>{e.titre}</h3>
              <p>{e.lieu} · {new Date(e.dateDebut).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
