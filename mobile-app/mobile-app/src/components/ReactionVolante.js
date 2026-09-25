import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, Easing } from 'react-native';

/**
 * Une seule "reaction volante" (coeur, feu, applaudissements...) qui monte
 * depuis le bas de l'ecran en dansant legerement de gauche a droite, puis
 * s'estompe et disparait - a la maniere des lives Instagram/TikTok. Chaque
 * instance se demonte elle-meme via onTermine une fois l'animation finie,
 * pour ne jamais laisser de composants invisibles s'accumuler en memoire.
 */
export default function ReactionVolante({ emoji, depart, onTermine }) {
  const progression = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progression, {
      toValue: 1,
      duration: 2800 + Math.random() * 800, // vitesse legerement aleatoire, plus naturel quand plusieurs reactions montent ensemble
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => { if (finished) onTermine(); });
  }, []);

  const translateY = progression.interpolate({ inputRange: [0, 1], outputRange: [0, -320] });
  // Petit serpentin gauche-droite-gauche pendant la montee, plutot qu'une ligne droite.
  const translateX = progression.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, depart.derive, -depart.derive, depart.derive, 0],
  });
  const opacity = progression.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] });
  const scale = progression.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.4, 1.15, 0.9] });

  return (
    <Animated.Text
      style={[
        styles.emoji,
        { left: depart.x, transform: [{ translateY }, { translateX }, { scale }], opacity },
      ]}
      pointerEvents="none"
    >
      {emoji}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  emoji: { position: 'absolute', bottom: 90, fontSize: 32 },
});
