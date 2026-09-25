import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Easing } from 'react-native';

const COULEURS = ['#FFCC21', '#22C55E', '#3B82F6', '#EC4899', '#A855F7', '#F97316'];
const NB_PARTICULES = 14;

/**
 * Petite explosion de confettis, declenchee au moment du vote (retour
 * visuel satisfaisant, plutot qu'un simple message texte discret). Se
 * demonte automatiquement via onTermine une fois l'animation finie.
 */
export default function ConfettiVote({ x, y, onTermine }) {
  const progression = useRef(new Animated.Value(0)).current;
  const particules = useRef(
    Array.from({ length: NB_PARTICULES }, (_, i) => ({
      angle: (i / NB_PARTICULES) * Math.PI * 2 + Math.random() * 0.5,
      distance: 40 + Math.random() * 50,
      couleur: COULEURS[i % COULEURS.length],
      taille: 6 + Math.random() * 5,
    }))
  ).current;

  useEffect(() => {
    Animated.timing(progression, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => { if (finished) onTermine(); });
  }, []);

  return (
    <View style={[StyleSheet.absoluteFillObject, { left: x - 60, top: y - 60, width: 120, height: 120 }]} pointerEvents="none">
      {particules.map((p, i) => {
        const translateX = progression.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.angle) * p.distance] });
        const translateY = progression.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.angle) * p.distance] });
        const opacity = progression.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1, 0] });
        const scale = progression.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0.5] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute', left: 60, top: 60, width: p.taille, height: p.taille, borderRadius: p.taille / 2,
              backgroundColor: p.couleur, opacity, transform: [{ translateX }, { translateY }, { scale }],
            }}
          />
        );
      })}
    </View>
  );
}
