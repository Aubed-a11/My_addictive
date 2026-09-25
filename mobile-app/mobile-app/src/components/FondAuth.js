import React from 'react';
import { View, ScrollView, StyleSheet, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Fond photo (scene de concert) partage par les 5 ecrans d'authentification
 * (connexion, inscription, otp, mot de passe oublie, reinitialisation), avec
 * un voile sombre pour garder les champs de saisie bien lisibles. Le bouton
 * retour est celui, unique, fourni par l'en-tete de navigation
 * (RootNavigator) : ne pas en ajouter un second ici.
 */
export default function FondAuth({ children }) {
  return (
    <ImageBackground source={require('../../assets/images/scene_auth.jpg')} style={{ flex: 1 }} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: 24, paddingTop: 20, paddingBottom: 50 },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.72)' },
});
