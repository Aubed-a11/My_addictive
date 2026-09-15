import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

const TOPS = [
  {
    type: 'streaming',
    ligne1: 'TOP',
    ligne2: 'STREAMING',
    // Photos reelles chargees a la volee (comme le reste du contenu demo de
    // l'app, ex. les evenements) : impossible pour moi de telecharger/
    // empaqueter des fichiers depuis mon environnement de developpement
    // (acces reseau restreint), ces URLs sont donc recuperees directement
    // par l'appareil de l'utilisateur au moment de l'affichage. picsum.photos
    // deja utilise ailleurs dans ce projet pour le meme usage (fiable,
    // verifie fonctionner), plutot qu'une URL Unsplash precise que je ne
    // peux pas verifier depuis mon environnement.
    image: 'https://picsum.photos/seed/top-streaming/400/300',
    couleurs: ['rgba(249,115,22,0.3)', 'rgba(124,45,18,0.85)'],
  },
  {
    type: 'telechargement_gratuit',
    ligne1: 'TOP',
    ligne2: 'TELECHARGEMENT GRATUIT',
    image: 'https://picsum.photos/seed/top-telechargement/400/300',
    couleurs: ['rgba(37,99,235,0.3)', 'rgba(15,23,42,0.85)'],
  },
  {
    type: 'ventes',
    ligne1: 'TOP',
    ligne2: 'VENTE',
    image: 'https://picsum.photos/seed/top-vente/400/300',
    couleurs: ['rgba(217,119,6,0.3)', 'rgba(30,58,138,0.85)'],
  },
];

/**
 * Section "Tous nos Tops" (page d'accueil Musique) : trois bannieres
 * visuelles menant chacune a un classement reellement distinct (streaming,
 * telechargements gratuits, ventes reelles) - voir MusiqueService.classement.
 * Inspiree de la maquette de reference fournie (photo + gros typo
 * blanche/coloree en surimpression, degrade pour la lisibilite).
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
          <Pressable key={top.type} onPress={() => navigation.navigate('ClassementMusique', { type: top.type })} style={styles.banniere}>
            <Image source={{ uri: top.image }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            <LinearGradient colors={top.couleurs} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }} style={styles.degrade}>
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
  banniere: { width: 170, height: 100, borderRadius: 16, overflow: 'hidden', backgroundColor: COLORS.fondCarte },
  degrade: { flex: 1, padding: 14, justifyContent: 'flex-end' },
  ligne1: { color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic', lineHeight: 24, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
  ligne2: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 2, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 4 },
});
