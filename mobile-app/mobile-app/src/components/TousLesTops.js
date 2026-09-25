import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { Star } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

// Vraies bannieres fournies par l'utilisateur (decoupees depuis sa maquette
// de reference), integrees comme assets locaux de l'app plutot que des URLs
// distantes : le texte et l'illustration font partie de l'image elle-meme.
const TOPS = [
  { type: 'streaming', image: require('../../assets/images/top_streaming.jpg') },
  { type: 'telechargement_gratuit', image: require('../../assets/images/top_telechargement.jpg') },
  { type: 'ventes', image: require('../../assets/images/top_vente.jpg') },
];

/**
 * Section "Tous nos Tops" (page d'accueil Musique) : trois bannieres
 * menant chacune a un classement reellement distinct (streaming,
 * telechargements gratuits, ventes reelles) - voir MusiqueService.classement.
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
            <Image source={top.image} style={styles.image} resizeMode="cover" />
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
  banniere: { width: 200, height: 90, borderRadius: 14, overflow: 'hidden', backgroundColor: COLORS.fondCarte },
  image: { width: '100%', height: '100%' },
});
