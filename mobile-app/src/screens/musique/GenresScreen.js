import React from 'react';
import { Text, StyleSheet, View, Pressable, Image, ImageBackground, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../theme/colors';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';
import EnteteLogo from '../../components/EnteteLogo';

// Genres reellement presents dans le catalogue (extraits des donnees
// importees : le champ "genre" y stocke plusieurs etiquettes concatenees
// par "#", ex. "afro#gospel#" - voir le correctif de TitreRepository).
// Pas d'illustration dediee par genre disponible : utilise l'icone
// My Addictive comme visuel, ainsi que demande explicitement.
const GENRES = [
  { cle: 'afro', libelle: 'Afro', couleur: '#F97316' },
  { cle: 'gospel', libelle: 'Gospel', couleur: '#3B82F6' },
  { cle: 'rap', libelle: 'Rap', couleur: '#A855F7' },
  { cle: 'slam', libelle: 'Slam', couleur: '#EF4444' },
  { cle: 'variete', libelle: 'Variete', couleur: COLORS.or },
];

/** Nos Genres (accueil Musique) : classification reelle du catalogue par genre. */
export default function GenresScreen({ navigation }) {
  return (
    <ImageBackground source={require('../../../assets/images/scene_musique.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <Text style={styles.titre}>Nos Genres</Text>
      <FlatList
        data={GENRES}
        numColumns={2}
        keyExtractor={(g) => g.cle}
        contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        columnWrapperStyle={{ gap: 14 }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.carte, { backgroundColor: item.couleur }]}
            onPress={() => navigation.navigate('GenreTitres', { genre: item.cle, libelle: item.libelle })}
          >
            <Image source={require('../../../assets/images/icone_myaddictive.png')} style={styles.icone} />
            <Text style={styles.libelleGenre}>{item.libelle}</Text>
          </Pressable>
        )}
      />
    <BottomTabBar navigation={navigation} variante="musique" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.65)' },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10, marginBottom: 6 },
  carte: { flex: 1, aspectRatio: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden' },
  icone: { width: 70, height: 70, marginBottom: 10 },
  libelleGenre: { color: '#fff', fontSize: 18, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 3 },
});
