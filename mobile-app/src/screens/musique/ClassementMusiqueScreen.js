import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, FlatList, View, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

export default function ClassementMusiqueScreen({ navigation }) {
  const [titres, setTitres] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/musique/classements', { params: { type: 'streaming', page: 0, size: 30 } });
      setTitres(data.content || []);
    })();
  }, []);

  return (
    <ImageBackground source={require('../../../assets/images/scene_musique.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Text style={styles.titre}>Nos Top  ·  top streaming</Text>
      <FlatList
                style={{ flex: 1 }}
        data={titres}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item, index }) => (
          <View style={styles.ligne}>
            <Text style={styles.rang}>{index + 1}</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.ligneTitre}>{item.nom}</Text>
              <Text style={styles.ligneMeta}>{item.artiste}</Text>
            </View>
            <Text style={styles.compteur}>{item.compteurEcoutes}</Text>
          </View>
        )}
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
  ligne: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 14, marginBottom: 10 },
  rang: { color: COLORS.musique, fontWeight: '800', fontSize: 18, width: 24 },
  ligneTitre: { color: '#fff', fontWeight: '700' },
  ligneMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
  compteur: { color: COLORS.texteAtténué, fontSize: 12 },
});
