import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';

/** Compte a rebours en direct (utilise pour les drops limites, section 8.2, et la fin de phase de vote, section 7.1). */
export default function CompteARebours({ dateCible, style, texteExpire = 'Disponible maintenant' }) {
  const [reste, setReste] = useState(calculer(dateCible, texteExpire));

  useEffect(() => {
    const intervalle = setInterval(() => setReste(calculer(dateCible, texteExpire)), 1000);
    return () => clearInterval(intervalle);
  }, [dateCible, texteExpire]);

  return <Text style={style}>{reste}</Text>;
}

function calculer(dateCible, texteExpire) {
  const diff = new Date(dateCible).getTime() - Date.now();
  if (diff <= 0) return texteExpire;
  const jours = Math.floor(diff / 86400000);
  const heures = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const secondes = Math.floor((diff % 60000) / 1000);
  if (jours > 0) return `${jours}j ${heures}h ${minutes}m`;
  return `${heures}h ${minutes}m ${secondes}s`;
}
