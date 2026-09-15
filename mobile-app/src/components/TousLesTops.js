import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, Headphones, Download, ShoppingBag } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

const TOPS = [
  {
    type: 'streaming',
    ligne1: 'TOP',
    ligne2: 'STREAMING',
    couleurs: ['#F97316', '#EA580C', '#7C2D12'],
    Icone: Headphones,
  },
  {
    type: 'telechargement_gratuit',
    ligne1: 'TOP',
    ligne2: 'TELECHARGEMENT GRATUIT',
    couleurs: ['#2563EB', '#1D4ED8', '#0F172A'],
    Icone: Download,
  },
  {
    type: 'ventes',
    ligne1: 'TOP',
    ligne2: 'VENTE',
    couleurs: [COLORS.or, '#B45309', '#1E3A8A'],
    Icone: ShoppingBag,
  },
];

/**
 * Section "Tous nos Tops" (page d'accueil Musique) : trois bannieres
 * visuelles menant chacune a un classement reellement distinct (streaming,
 * telechargements gratuits, ventes reelles) - voir MusiqueService.classement.
 * Inspiree de la maquette de reference fournie (gros typo blanche/coloree
 * sur fond degrade), adaptee sans illustrations personnalisees.
 */
export default function TousLesTops({ navigation }) {
  return (
    <View style={styles.section}>
      <View style={styles.entete}>
        <Star size={16} color={COLORS.or} fill={COLORS.or} />
        <Text style={styles.titreSection}>Tous nos Tops</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liste}>
        {TOPS.map((top) => (
          <Pressable key={top.type} onPress={() => navigation.navigate('ClassementMusique', { type: top.type })}>
            <LinearGradient colors={top.couleurs} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banniere}>
              <top.Icone size={26} color="rgba(255,255,255,0.35)" style={styles.iconeFond} />
              <Text style={styles.ligne1}>{top.ligne1}</Text>
              <Text style={styles.ligne2}>{top.ligne2}</Text>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, marginBottom: 10 },
  titreSection: { color: '#fff', fontSize: 16, fontWeight: '800' },
  liste: { paddingHorizontal: 16, gap: 12 },
  banniere: { width: 170, height: 100, borderRadius: 16, padding: 14, justifyContent: 'flex-end', overflow: 'hidden' },
  iconeFond: { position: 'absolute', top: 10, right: 10 },
  ligne1: { color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic', lineHeight: 24 },
  ligne2: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 2 },
});
