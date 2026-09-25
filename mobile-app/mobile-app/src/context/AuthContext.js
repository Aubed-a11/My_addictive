import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client, { definirGestionnaireDeconnexionAutomatique } from '../api/client';

/**
 * Contexte d'authentification global. Principe d'acces libre (section 3.1) :
 * l'application ne force jamais la connexion au demarrage ; les ecrans qui le
 * necessitent appellent exigerConnexion() et redirigent vers /Login si besoin.
 * Authentification par email + mot de passe (inscription en une seule etape).
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [jeton, setJeton] = useState(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    (async () => {
      const jetonStocke = await AsyncStorage.getItem('jeton');
      const utilisateurStocke = await AsyncStorage.getItem('utilisateur');
      if (jetonStocke && utilisateurStocke) {
        setJeton(jetonStocke);
        setUtilisateur(JSON.parse(utilisateurStocke));
      }
      setPret(true);
    })();
  }, []);

  const enregistrerSession = useCallback(async (reponseAuth) => {
    await AsyncStorage.setItem('jeton', reponseAuth.jeton);
    await AsyncStorage.setItem('utilisateur', JSON.stringify(reponseAuth.utilisateur));
    setJeton(reponseAuth.jeton);
    setUtilisateur(reponseAuth.utilisateur);
  }, []);

  // Inscription en une seule etape : connecte immediatement (pas de code de verification).
  const inscrire = useCallback(async (email, motDePasse, nomComplet) => {
    const { data } = await client.post('/api/compte/auth/inscription', { email, motDePasse, nomComplet });
    await enregistrerSession(data);
    return data;
  }, [enregistrerSession]);

  const connecter = useCallback(async (email, motDePasse) => {
    const { data } = await client.post('/api/compte/auth/connexion', { email, motDePasse });
    await enregistrerSession(data);
    return data;
  }, [enregistrerSession]);

  const demanderReinitialisation = useCallback(async (email) => {
    await client.post('/api/compte/auth/mot-de-passe-oublie', { email });
  }, []);

  const reinitialiserMotDePasse = useCallback(async (email, code, nouveauMotDePasse) => {
    await client.post('/api/compte/auth/reinitialiser-mot-de-passe', { email, code, nouveauMotDePasse });
  }, []);

  const deconnecter = useCallback(async () => {
    await AsyncStorage.multiRemove(['jeton', 'utilisateur']);
    setJeton(null);
    setUtilisateur(null);
  }, []);

  // Quand le jeton devient invalide/expire en cours d'usage (voir
  // client.js), on reutilise la meme logique de deconnexion pour que
  // l'app repasse proprement en mode "visiteur" au lieu de rester bloquee
  // avec des appels qui echouent silencieusement en boucle.
  useEffect(() => {
    definirGestionnaireDeconnexionAutomatique(deconnecter);
  }, [deconnecter]);

  const rafraichirProfil = useCallback(async () => {
    const { data } = await client.get('/api/compte/moi');
    await AsyncStorage.setItem('utilisateur', JSON.stringify(data));
    setUtilisateur(data);
    return data;
  }, []);

  return (
    <AuthContext.Provider value={{
      utilisateur, jeton, pret, estConnecte: !!jeton,
      inscrire, connecter, demanderReinitialisation, reinitialiserMotDePasse,
      deconnecter, rafraichirProfil,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit etre utilise a l\'interieur de AuthProvider');
  return ctx;
}
