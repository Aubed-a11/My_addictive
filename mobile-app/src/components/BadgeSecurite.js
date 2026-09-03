import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

export default function BadgeSecurite({ texte = "Nous ne partageons jamais vos informations." }) {
  return (
    <View style={styles.conteneur}>
      <View style={styles.icone}><ShieldCheck color="#8B5CF6" size={18} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.titre}>Vos donnees sont securisees</Text>
        <Text style={styles.texte}>{texte}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14, marginTop: 18, gap: 12 },
  icone: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(139,92,246,0.15)', alignItems: 'center', justifyContent: 'center' },
  titre: { color: '#fff', fontSize: 13, fontWeight: '600' },
  texte: { color: COLORS.texteAtténué, fontSize: 11, marginTop: 2 },
});
