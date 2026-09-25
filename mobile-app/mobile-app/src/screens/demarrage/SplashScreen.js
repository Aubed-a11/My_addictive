import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logo from '../../components/Logo';
import { COLORS } from '../../theme/colors';

// Duree de l'ecran de demarrage, fixee a 15s a la demande explicite du
// commanditaire. Ajuster cette seule constante si besoin.
const DUREE_MS = 15000;

/**
 * Ecran de demarrage (splash), fidele a la maquette de reference : fond
 * sombre, anneaux concentriques derriere le logo, halo de scene en bas
 * (evoquant un concert), barre de chargement animee.
 */
export default function SplashScreen({ navigation }) {
  const largeurBarre = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(largeurBarre, {
      toValue: 1,
      duration: DUREE_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const minuteur = setTimeout(async () => {
      const onboardingVu = await AsyncStorage.getItem('onboarding_vu');
      navigation.replace(onboardingVu ? 'Hub' : 'Onboarding');
    }, DUREE_MS);

    return () => clearTimeout(minuteur);
  }, [navigation, largeurBarre]);

  return (
    <ImageBackground source={require('../../../assets/images/scene_bienvenue.jpg')} style={styles.conteneur} resizeMode="cover">
      <View style={styles.voile} />
      <View style={styles.cercles}>
        <View style={[styles.cercle, { width: 280, height: 280, opacity: 0.12 }]} />
        <View style={[styles.cercle, { width: 200, height: 200, opacity: 0.18 }]} />
        <View style={[styles.cercle, { width: 130, height: 130, opacity: 0.26 }]} />
      </View>

      <View style={styles.centre}>
        <Logo taille={78} />
        <Text style={styles.accroche}>Vivez. Ecoutez. Participez.</Text>
        <Text style={styles.slogan}>Tout votre univers, au meme endroit.</Text>
      </View>

      <View style={styles.bas}>
        <LinearGradient colors={['rgba(139,92,246,0)', 'rgba(139,92,246,0.35)']} style={styles.haloScene} />
        <View style={styles.pisteBarre}>
          <Animated.View
            style={[
              styles.barre,
              { width: largeurBarre.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          />
        </View>
        <Text style={styles.chargement}>Chargement...</Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 80, overflow: 'hidden' },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.55)' },
  cercles: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  cercle: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: COLORS.or },
  centre: { alignItems: 'center' },
  accroche: { color: '#fff', fontSize: 15, marginTop: 22, fontWeight: '600' },
  slogan: { color: COLORS.or, fontSize: 13, marginTop: 6 },
  bas: { width: '60%', alignItems: 'center' },
  haloScene: { position: 'absolute', bottom: -40, width: 400, height: 180, borderRadius: 200 },
  pisteBarre: { width: '100%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' },
  barre: { height: '100%', backgroundColor: COLORS.or, borderRadius: 2 },
  chargement: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 10 },
});
