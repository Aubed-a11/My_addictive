import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { DEGRADE_BOUTON } from '../theme/auth';

/** Bouton pilule en degrade rose->violet, avec fleche, utilise sur tous les ecrans d'authentification. */
export default function BoutonDegrade({ titre, onPress, chargement = false, disabled = false, avecFleche = true }) {
  return (
    <Pressable onPress={onPress} disabled={disabled || chargement} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}>
      <LinearGradient colors={DEGRADE_BOUTON} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.bouton, disabled && { opacity: 0.5 }]}>
        {chargement ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.texte}>{titre}</Text>
            {avecFleche && <ArrowRight color="#fff" size={20} style={{ marginLeft: 8 }} />}
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 30, marginVertical: 8 },
  texte: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
