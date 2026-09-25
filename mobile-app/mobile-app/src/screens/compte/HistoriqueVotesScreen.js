import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, FlatList, View, Pressable, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/** Historique de votes (section 9.1, "Mon compte") : chaque vote correspond a une piece definitivement depensee. */
export default function HistoriqueVotesScreen({ navigation }) {
  const [votes, setVotes] = useState([]);
  const [candidats, setCandidats] = useState({});

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/votes/mes-votes');
      setVotes(data);
      const details = {};
      await Promise.all(data.map(async (v) => {
        try {
          const { data: c } = await client.get(`/api/votes/candidats/${v.candidatId}`);
          details[v.candidatId] = c;
        } catch {}
      }));
      setCandidats(details);
    })();
  }, []);

  return (
    <ImageBackground source={require('../../../assets/images/scene_connexion.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Text style={styles.titre}>Historique de mes votes</Text>
      <FlatList
                style={{ flex: 1 }}
        data={votes}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const candidat = candidats[item.candidatId];
          return (
            <Pressable style={styles.ligne} onPress={() => candidat && navigation.navigate('CandidatDetail', { id: item.candidatId })}>
              {candidat?.photoUrl ? (
                <Image source={{ uri: resoudreUrlImage(candidat.photoUrl) }} style={styles.photo} />
              ) : (
                <IconePlaceholder style={styles.photo} />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.ligneTitre}>{candidat ? candidat.nom : `Candidat #${item.candidatId}`}</Text>
                <Text style={styles.ligneMeta}>{new Date(item.dateVote).toLocaleString('fr-FR')}</Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={styles.vide}>Vous n'avez pas encore vote.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="votes" ongletActif="historique" />
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
  photo: { width: 44, height: 44, borderRadius: 22 },
  ligneTitre: { color: '#fff', fontWeight: '600' },
  ligneMeta: { color: COLORS.texteAtténué, fontSize: 11, marginTop: 4 },
});
