import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { connecter } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  const soumettre = async (e) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    try {
      await connecter(email, motDePasse);
      navigate('/');
    } catch (err) {
      setErreur(err.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="ecran-connexion">
      <form className="carte-connexion" onSubmit={soumettre}>
        <div className="logo-admin"><span className="bleu">My</span> <span className="or">Q</span><span className="bleu">ddictive</span></div>
        <div className="sous-logo">Back-office administrateur</div>

        <div className="champ">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@myaddictive.com" autoCapitalize="none" />
        </div>
        <div className="champ">
          <label>Mot de passe</label>
          <input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
        </div>

        {erreur && <div className="erreur">{erreur}</div>}

        <button className="bouton" type="submit" disabled={chargement} style={{ width: '100%', justifyContent: 'center' }}>
          {chargement ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
