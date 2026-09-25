import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

/**
 * En-tete avec l'icone "coupee" du logo My Addictive (juste la spirale +
 * "My", sans le texte "ddictive" : plus compacte que le logo complet),
 * centree, presente en haut de chaque section principale ET de leurs
 * sous-ecrans (fiche detail, lecteur...), pour qu'elle reste visible en
 * permanence lors de la navigation au sein d'une meme section plutot que
 * de disparaitre des qu'on rentre dans un sous-ecran.
 */
export default function EnteteLogo() {
  return (
    <View style={styles.conteneur}>
      <Image
        source={require('../../assets/images/icone_myaddictive.png')}
        style={styles.icone}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { alignItems: 'center', paddingTop: 16, paddingBottom: 4 },
  icone: { width: 34, height: 34 },
});
