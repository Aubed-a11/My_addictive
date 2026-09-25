import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, FlatList, View, Pressable, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/** Historique d'ecoute (section 9.1, "Mon compte"). */
export default function HistoriqueEcouteScreen({ navigation }) {
  const [ecoutes, setEcoutes] = useState([]);
  const [titres, setTitres] = useState({});

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/musique/mes-ecoutes');
      setEcoutes(data);
      const details = {};
      await Promise.all(data.map(async (e) => {
        try {
          const { data: t } = await client.get(`/api/musique/titres/${e.titreId}`);
          details[e.titreId] = t;
        } catch {}
      }));
      setTitres(details);
    })();
  }, []);

  return (
    <ImageBackground source={require('../../../assets/images/scene_musique.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Text style={styles.titre}>Historique d'ecoute</Text>
      <FlatList
                style={{ flex: 1 }}
        data={ecoutes}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const titre = titres[item.titreId];
          return (
            <Pressable style={styles.ligne} onPress={() => titre && navigation.navigate('TitreDetail', { id: item.titreId })}>
              {titre?.imageUrl ? (
                <Image source={{ uri: resoudreUrlImage(titre.imageUrl) }} style={styles.pochette} />
              ) : (
                <IconePlaceholder style={styles.pochette} />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.ligneTitre}>{titre ? titre.nom : `Titre #${item.titreId}`}</Text>
                <Text style={styles.ligneArtiste}>{titre?.artiste}</Text>
                <Text style={styles.ligneMeta}>{new Date(item.dateEcoute).toLocaleString('fr-FR')}</Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={styles.vide}>Aucune ecoute enregistree pour le moment.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="compte" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 20, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  ligne: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 12, marginBottom: 10 },
  pochette: { width: 44, height: 44, borderRadius: 8 },
  ligneTitre: { color: '#fff', fontWeight: '600' },
  ligneArtiste: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 2 },
  ligneMeta: { color: COLORS.texteAtténué, fontSize: 11, marginTop: 2 },
});
