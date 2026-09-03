import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { estConnecte, pret } = useAuth();
  if (!pret) return null;
  if (!estConnecte) return <Navigate to="/connexion" replace />;
  return children;
}
