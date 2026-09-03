import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, FlatList, View, Pressable, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import EnteteLogo from '../../components/EnteteLogo';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

export default function AlbumsScreen({ navigation }) {
  const [albums, setAlbums] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/musique/albums', { params: { page: 0, size: 30 } });
      setAlbums(data.content || []);
    })();
  }, []);

  return (
    <ImageBackground source={require('../../../assets/images/scene_musique.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <Text style={styles.titre}>Albums & mixtapes</Text>
      <FlatList
                style={{ flex: 1 }}
        data={albums}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.carte} onPress={() => navigation?.navigate?.('Albums')}>
            {item.imageUrl ? (
              <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.pochette} />
            ) : (
              <IconePlaceholder style={styles.pochette} />
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.carteTitre}>{item.titre}</Text>
              <Text style={styles.carteMeta}>{item.artiste} · {item.dateSortie || ''}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.vide}>Aucun album pour le moment.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="musique" ongletActif="rubrique" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  carte: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: COLORS.bordure },
  pochette: { width: 60, height: 60, borderRadius: 8 },
  carteTitre: { color: '#fff', fontWeight: '700' },
  carteMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
});
