import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import EnteteLogo from '../../components/EnteteLogo';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

export default function PodcastsScreen({ navigation }) {
  const { estConnecte } = useAuth();
  const [podcasts, setPodcasts] = useState([]);
  const [episodesParPodcast, setEpisodesParPodcast] = useState({});
  const [abonnes, setAbonnes] = useState({});

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/live/podcasts', { params: { page: 0, size: 30 } });
      setPodcasts(data.content || []);
    })();
  }, []);

  const voirEpisodes = async (id) => {
    const { data } = await client.get(`/api/live/podcasts/${id}/episodes`);
    setEpisodesParPodcast((prev) => ({ ...prev, [id]: data }));
  };

  // Abonnement a une emission (section 6.4) : notification a la sortie d'un nouvel episode.
  const abonner = async (id) => {
    if (!estConnecte) { navigation.navigate('Connexion'); return; }
    await client.post(`/api/live/podcasts/${id}/abonnement`);
    setAbonnes((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <ImageBackground source={require('../../../assets/images/scene_musique.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <Text style={styles.titre}>Podcasts</Text>
      <FlatList
                style={{ flex: 1 }}
        data={podcasts}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        renderItem={({ item }) => (
          <View style={styles.carte}>
            <Pressable style={styles.ligneEntete} onPress={() => voirEpisodes(item.id)}>
              {item.imageUrl ? (
                <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.vignette} />
              ) : (
                <IconePlaceholder style={styles.vignette} tailleIcone="55%" />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.carteTitre}>{item.titre}</Text>
                {item.editeur && <Text style={styles.editeur}>Par {item.editeur}</Text>}
                <Text style={styles.carteMeta} numberOfLines={2}>{item.description}</Text>
              </View>
            </Pressable>
            <Pressable style={[styles.boutonAbonnement, abonnes[item.id] && styles.boutonAbonneActif]} onPress={() => abonner(item.id)}>
              <Text style={[styles.boutonTexte, abonnes[item.id] && { color: COLORS.billetterie }]}>{abonnes[item.id] ? 'Abonne' : "S'abonner"}</Text>
            </Pressable>
            {(episodesParPodcast[item.id] || []).map((ep) => (
              <Text key={ep.id} style={styles.episode}>S{ep.numeroSaison} E{ep.numeroEpisode}  ·  {ep.titre}</Text>
            ))}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.vide}>Aucun podcast pour le moment.</Text>}
      />
      <BottomTabBar navigation={navigation} variante="live" ongletActif="live" />
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  carte: {
    backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3,
  },
  ligneEntete: { flexDirection: 'row', alignItems: 'center' },
  vignette: { width: 56, height: 56, borderRadius: 10 },
  carteTitre: { color: '#fff', fontWeight: '700' },
  editeur: { color: COLORS.billetterie, fontSize: 12, fontWeight: '600', marginTop: 2 },
  carteMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
  boutonAbonnement: { alignSelf: 'flex-start', backgroundColor: COLORS.billetterie, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 14, marginTop: 10 },
  boutonAbonneActif: { backgroundColor: COLORS.fondCarteClair },
  boutonTexte: { color: '#fff', fontSize: 11, fontWeight: '700' },
  episode: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 6 },
});
