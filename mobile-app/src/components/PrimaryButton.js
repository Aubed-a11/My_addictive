import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme/colors';

export default function PrimaryButton({ titre, onPress, couleur = COLORS.hub, chargement = false, disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || chargement}
      style={({ pressed }) => [
        styles.bouton,
        { backgroundColor: couleur, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {chargement ? <ActivityIndicator color="#fff" /> : <Text style={styles.texte}>{titre}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginVertical: 8 },
  texte: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
