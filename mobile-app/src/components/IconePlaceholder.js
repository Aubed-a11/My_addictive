import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

/**
 * Image de remplacement utilisee partout ou un contenu (titre, album,
 * chaine, produit...) n'a pas encore de vrai visuel : l'icone "coupee" du
 * logo My Addictive (juste la spirale + "My"), plutot qu'un rectangle vide
 * ou une simple couleur unie.
 */
export default function IconePlaceholder({ style, tailleIcone = '55%' }) {
  return (
    <View style={[styles.conteneur, style]}>
      <Image
        source={require('../../assets/images/icone_myaddictive.png')}
        style={{ width: tailleIcone, height: tailleIcone }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { backgroundColor: COLORS.fondCarteClair, alignItems: 'center', justifyContent: 'center' },
});
