import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Ticket, Trophy, Newspaper, Music, ShoppingBag, Store, Users, Radio, Mic, Wallet, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LIENS = [
  { chemin: '/', label: 'Tableau de bord', Icone: LayoutDashboard },
  { chemin: '/evenements', label: 'Evenements', Icone: Ticket },
  { chemin: '/chaines', label: 'Chaines', Icone: Radio },
  { chemin: '/podcasts', label: 'Podcasts', Icone: Mic },
  { chemin: '/competitions', label: 'Competitions & Votes', Icone: Trophy },
  { chemin: '/articles', label: 'Media & actualites', Icone: Newspaper },
  { chemin: '/musique', label: 'Musique', Icone: Music },
  { chemin: '/boutique', label: 'Boutique', Icone: ShoppingBag },
  { chemin: '/vendeurs', label: 'Vendeurs', Icone: Store },
  { chemin: '/paiements', label: 'Paiements en agence', Icone: Wallet },
  { chemin: '/utilisateurs', label: 'Utilisateurs', Icone: Users },
];

export default function Sidebar() {
  const { deconnecter, utilisateur } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="barre-laterale">
      <div className="logo-admin"><span className="bleu">My</span> <span className="or">Q</span><span className="bleu">ddictive</span></div>
      <div className="sous-logo">Back-office · {utilisateur?.nomComplet}</div>

      {LIENS.map((l) => (
        <NavLink
          key={l.chemin}
          to={l.chemin}
          end={l.chemin === '/'}
          className={({ isActive }) => `nav-lien${isActive ? ' actif' : ''}`}
        >
          <l.Icone size={17} /> {l.label}
        </NavLink>
      ))}

      <div
        className="nav-lien"
        style={{ marginTop: 24, borderTop: '1px solid var(--bordure)', paddingTop: 20 }}
        onClick={() => { deconnecter(); navigate('/connexion'); }}
      >
        <LogOut size={17} /> Deconnexion
      </div>
    </div>
  );
}
