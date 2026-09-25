import React from 'react';
import { View } from 'react-native';

/** Petit drapeau approxime par 3 bandes de couleur (evite de charger des images de drapeaux). */
export default function DrapeauPetit({ couleurs, taille = 20 }) {
  return (
    <View style={{ width: taille, height: taille * 0.7, borderRadius: 3, overflow: 'hidden', flexDirection: 'row' }}>
      {couleurs.map((c, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: c }} />
      ))}
    </View>
  );
}
