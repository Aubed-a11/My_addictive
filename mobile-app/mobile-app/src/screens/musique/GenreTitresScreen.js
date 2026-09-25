import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, FlatList, View, Pressable, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/** Titres filtres par genre (voir GenresScreen). */
export default function GenreTitresScreen({ navigation, route }) {
  const { genre, libelle } = route.params;
  const [titres, setTitres] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/musique/titres', { params: { genre, page: 0, size: 30 } });
      setTitres(data.content || []);
    })();
  }, [genre]);

  return (
    <ImageBackground source={require('../../../assets/images/scene_musique.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Text style={styles.titre}>Genre : {libelle}</Text>
      <FlatList
        style={{ flex: 1 }}
        data={titres}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.ligne} onPress={() => navigation.navigate('TitreDetail', { id: item.id })}>
            {item.imageUrl ? (
              <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.pochette} />
            ) : (
              <IconePlaceholder style={styles.pochette} tailleIcone="55%" />
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.nomTitre} numberOfLines={1}>{item.nom}</Text>
              <Text style={styles.artiste} numberOfLines={1}>{item.artiste}</Text>
            </View>
            {!item.gratuit && <Text style={styles.prix}>{item.prixFcfa} FCFA</Text>}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.vide}>Aucun titre dans ce genre pour le moment.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="musique" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 20, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10, marginBottom: 6 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  ligne: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 10, marginBottom: 10 },
  pochette: { width: 50, height: 50, borderRadius: 8 },
  nomTitre: { color: '#fff', fontWeight: '700' },
  artiste: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
  prix: { color: COLORS.or, fontSize: 12, fontWeight: '700' },
});
