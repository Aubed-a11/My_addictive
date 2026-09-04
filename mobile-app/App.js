import 'react-native-gesture-handler'; // DOIT etre le tout premier import : requis par React Navigation.
import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
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
 * Sur le web, au-dela d'une certaine largeur d'ecran, une interface pensee
 * pour mobile devient difficile a lire si elle s'etire sur toute la
 * fenetre (texte et listes trop larges). On limite donc simplement la
 * largeur de contenu sur grand ecran, sans aucune decoration de cadre,
 * d'encoche ou d'ombre : juste une colonne centree, comme le font la
 * plupart des sites web responsives (Twitter, Instagram web...). Sur
 * mobile (natif ou navigateur mobile), cette limite ne s'applique jamais.
 */
const LARGEUR_MAX_CONTENU = 480;

/**
 * Sur le web, le conteneur racine doit explicitement occuper toute la
 * hauteur de la fenetre (100vh) : sans ca, le contenu ne prend que sa
 * hauteur naturelle et le reste de l'ecran reste vide/noir, meme si les
 * composants internes utilisent flex:1 (qui ne sert a rien sans un
 * ancetre a hauteur definie). Ceci s'applique sur TOUTE largeur d'ecran
 * web, telephone compris - contrairement a la limitation de largeur
 * (colonne centree), qui elle ne s'applique qu'au-dela de la largeur d'un
 * telephone.
 */
function ConteneurResponsive({ children }) {
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web') return children;
  const etroit = width <= LARGEUR_MAX_CONTENU;
  return (
    <View style={styles.pageWeb}>
      <View style={[styles.colonne, etroit && { maxWidth: '100%' }]}>{children}</View>
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
    <ConteneurResponsive>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ConteneurResponsive>
  );
}

const styles = StyleSheet.create({
  pageWeb: { flex: 1, minHeight: '100vh', alignItems: 'center', backgroundColor: '#0A0A0F' },
  colonne: { width: '100%', maxWidth: LARGEUR_MAX_CONTENU, flex: 1 },
});
