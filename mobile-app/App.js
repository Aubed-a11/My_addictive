import 'react-native-gesture-handler'; // DOIT etre le tout premier import : requis par React Navigation.
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreenNatif from 'expo-splash-screen';
import { useFonts, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

// Garde le splash natif (ecran blanc/logo systeme) affiche tant que la
// police cursive du logo n'est pas chargee, pour eviter un flash visuel
// ou "My" s'afficherait brievement dans une police par defaut.
SplashScreenNatif.preventAutoHideAsync().catch(() => {});

/**
 * Sur le web (navigateur), une app React Native s'etire naturellement pour
 * remplir toute la fenetre - ce n'est pas ce qu'on veut pour previsualiser
 * une app mobile. On la contraint donc dans un cadre a taille de telephone,
 * centre sur la page. Sur un vrai telephone (iOS/Android via Expo Go), ce
 * cadre n'existe pas : l'app occupe tout l'ecran normalement.
 */
function CadreTelephoneWeb({ children }) {
  if (Platform.OS !== 'web') return children;
  return (
    <View style={styles.pageWeb}>
      <View style={styles.cadre}>
        <View style={styles.encoche} />
        <View style={styles.ecran}>{children}</View>
      </View>
    </View>
  );
}

export default function App() {
  const [policesChargees] = useFonts({ DancingScript_700Bold });

  const surLayoutRacine = useCallback(async () => {
    if (policesChargees) {
      await SplashScreenNatif.hideAsync();
    }
  }, [policesChargees]);

  useEffect(() => { surLayoutRacine(); }, [surLayoutRacine]);

  if (!policesChargees) {
    return null; // le splash natif reste visible
  }

  return (
    <CadreTelephoneWeb>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </CadreTelephoneWeb>
  );
}

const styles = StyleSheet.create({
  pageWeb: {
    flex: 1,
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
  },
  cadre: {
    width: 390,
    height: 844,
    borderRadius: 44,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 10,
    borderColor: '#000',
    boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
  },
  encoche: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -70,
    width: 140,
    height: 26,
    backgroundColor: '#000',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    zIndex: 10,
  },
  ecran: {
    flex: 1,
    borderRadius: 34,
    overflow: 'hidden',
  },
});
