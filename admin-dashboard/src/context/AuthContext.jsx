import React, { createContext, useContext, useEffect, useState } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

/**
 * Authentification du back-office. Reutilise le meme compte-service que
 * l'app mobile (connexion par email + mot de passe) ; seul un compte
 * de role ADMINISTRATEUR est accepte ici (voir AmorceAdministrateur cote
 * backend pour le compte cree automatiquement au premier demarrage).
 */
export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('admin_utilisateur');
    if (u) setUtilisateur(JSON.parse(u));
    setPret(true);
  }, []);

  const connecter = async (email, motDePasse) => {
    const { data } = await client.post('/api/compte/auth/connexion', { email, motDePasse });
    if (data.utilisateur.role !== 'ADMINISTRATEUR') {
      throw new Error("Ce compte n'a pas les droits d'administration.");
    }
    localStorage.setItem('admin_jeton', data.jeton);
    localStorage.setItem('admin_utilisateur', JSON.stringify(data.utilisateur));
    setUtilisateur(data.utilisateur);
  };

  const deconnecter = () => {
    localStorage.removeItem('admin_jeton');
    localStorage.removeItem('admin_utilisateur');
    setUtilisateur(null);
  };

  return (
    <AuthContext.Provider value={{ utilisateur, pret, estConnecte: !!utilisateur, connecter, deconnecter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit etre utilise dans AuthProvider');
  return ctx;
}
