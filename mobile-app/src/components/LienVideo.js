import React from 'react';
import { Text, StyleSheet, Pressable, Linking } from 'react-native';
import { PlayCircle } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

/**
 * Remplace l'ancien lecteur video integre : l'application n'embarque plus de
 * lecteur media. Le bouton ouvre simplement le lien (direct, replay, clip...)
 * dans le navigateur ou l'application video de l'appareil.
 */
export default function LienVideo({ url, libelle = 'Regarder la vidéo', messageAbsent = "Aucune vidéo disponible pour le moment.", couleur = COLORS.or }) {
  if (!url) return <Text style={styles.absent}>{messageAbsent}</Text>;
  const ouvrir = () => { Linking.openURL(url).catch(() => {}); };
  return (
    <Pressable onPress={ouvrir} style={[styles.bouton, { borderColor: couleur }]}>
      <PlayCircle color={couleur} size={22} />
      <Text style={[styles.texte, { color: couleur }]}>{libelle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginVertical: 10 },
  texte: { fontSize: 14, fontWeight: '700' },
  absent: { color: COLORS.texteAtténué, fontSize: 13, textAlign: 'center', marginVertical: 10 },
});
