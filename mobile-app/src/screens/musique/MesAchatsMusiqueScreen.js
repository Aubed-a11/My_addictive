import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, FlatList, View, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/** Historique reel des titres achetes (section 9.1), distinct de la navigation Music Store. */
export default function MesAchatsMusiqueScreen({ navigation }) {
  const [achats, setAchats] = useState([]);
  const [titres, setTitres] = useState({});
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/api/musique/mes-achats');
        setAchats(data);
        // Recupere le detail (nom, artiste) de chaque titre achete pour un affichage lisible.
        const details = {};
        await Promise.all(data.map(async (a) => {
          try {
            const { data: t } = await client.get(`/api/musique/titres/${a.titreId}`);
            details[a.titreId] = t;
          } catch {}
        }));
        setTitres(details);
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  return (
    <ImageBackground source={require('../../../assets/images/scene_musique.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Text style={styles.titre}>Mes achats</Text>
      <Text style={styles.sousTitre}>Titres achetes sur le Music Store</Text>
      <FlatList
                style={{ flex: 1 }}
        data={achats}
        keyExtractor={(a) => String(a.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const titre = titres[item.titreId];
          return (
            <Pressable style={styles.ligne} onPress={() => titre && navigation.navigate('TitreDetail', { id: item.titreId })}>
              <View>
                <Text style={styles.ligneTitre}>{titre ? titre.nom : `Titre #${item.titreId}`}</Text>
                <Text style={styles.ligneMeta}>{titre?.artiste || ''}</Text>
              </View>
              <Text style={styles.date}>{new Date(item.dateAchat).toLocaleDateString('fr-FR')}</Text>
            </Pressable>
          );
        }}
        ListEmptyComponent={!chargement && <Text style={styles.vide}>Aucun achat pour le moment. Les titres gratuits n'apparaissent pas ici.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="musique" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 20, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10 },
  sousTitre: { color: COLORS.texteAtténué, fontSize: 12, paddingHorizontal: 16, marginTop: 4 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40, paddingHorizontal: 20 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 14, marginBottom: 10 },
  ligneTitre: { color: '#fff', fontWeight: '700' },
  ligneMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
  date: { color: COLORS.texteAtténué, fontSize: 11 },
});
