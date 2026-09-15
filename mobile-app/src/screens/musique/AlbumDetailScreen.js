import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, FlatList, View, Pressable, Image, ImageBackground, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play } from 'lucide-react-native';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import EnteteLogo from '../../components/EnteteLogo';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/** Detail d'un album : pochette, metadonnees, et liste reelle de ses titres (section 5.1). */
export default function AlbumDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const [album, setAlbum] = useState(null);
  const [titres, setTitres] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: a }, { data: t }] = await Promise.all([
          client.get(`/api/musique/albums/${id}`),
          client.get('/api/musique/titres', { params: { albumId: id, page: 0, size: 50 } }),
        ]);
        setAlbum(a);
        setTitres(t.content || []);
      } finally {
        setChargement(false);
      }
    })();
  }, [id]);

  if (chargement) return <ActivityIndicator color={COLORS.musique} style={{ marginTop: 40 }} />;
  if (!album) return null;

  return (
    <ImageBackground source={require('../../../assets/images/scene_musique.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <View style={styles.entete}>
        {album.imageUrl ? (
          <Image source={{ uri: resoudreUrlImage(album.imageUrl) }} style={styles.pochette} />
        ) : (
          <IconePlaceholder style={styles.pochette} />
        )}
        <Text style={styles.titre}>{album.titre}</Text>
        <Text style={styles.meta}>{album.artiste}{album.dateSortie ? `  ·  ${album.dateSortie}` : ''}</Text>
        <Text style={styles.nombreTitres}>{titres.length} titre{titres.length > 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={titres}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        renderItem={({ item, index }) => (
          <Pressable style={styles.ligneTitre} onPress={() => navigation.navigate('TitreDetail', { id: item.id })}>
            <Text style={styles.numero}>{index + 1}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.nomTitre} numberOfLines={1}>{item.nom}</Text>
              {!item.gratuit && <Text style={styles.prixTitre}>{item.prixFcfa} FCFA</Text>}
            </View>
            <Play color={COLORS.musique} size={18} />
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.vide}>Aucun titre associe a cet album pour le moment.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="musique" ongletActif="rubrique" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  entete: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  pochette: { width: 160, height: 160, borderRadius: 14, marginBottom: 14 },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  meta: { color: COLORS.texteAtténué, fontSize: 13, marginTop: 6 },
  nombreTitres: { color: COLORS.musique, fontSize: 12, fontWeight: '700', marginTop: 8 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 20 },
  ligneTitre: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 10, padding: 12, marginBottom: 8 },
  numero: { color: COLORS.texteAtténué, fontWeight: '700', width: 20, textAlign: 'center' },
  nomTitre: { color: '#fff', fontWeight: '600', fontSize: 14 },
  prixTitre: { color: COLORS.or, fontSize: 11, marginTop: 2 },
});
