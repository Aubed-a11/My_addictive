import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import PrimaryButton from '../../components/PrimaryButton';
import { COLORS } from '../../theme/colors';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/** Recommandations construites a partir de l'historique d'ecoute (section 5.2). */
export default function RecommandationsScreen({ navigation }) {
  const { estConnecte } = useAuth();
  const [titres, setTitres] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!estConnecte) { setChargement(false); return; }
    (async () => {
      try {
        const { data } = await client.get('/api/musique/recommandations');
        setTitres(data);
      } finally {
        setChargement(false);
      }
    })();
  }, [estConnecte]);

  if (!estConnecte) {
    return (
      <ImageBackground source={require('../../../assets/images/scene_bienvenue.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ padding: 20, alignItems: 'center', marginTop: 40 }}>
          <Text style={styles.titre}>Pour vous</Text>
          <Text style={styles.sousTitre}>Connectez-vous pour recevoir des recommandations basees sur votre historique d'ecoute.</Text>
          <PrimaryButton titre="Se connecter" onPress={() => navigation.navigate('Connexion')} couleur={COLORS.musique} />
        </View>
      </SafeAreaView>
    </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../../assets/images/scene_bienvenue.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Text style={styles.titre}>Recommande pour vous</Text>
      <Text style={styles.sousTitre}>Base sur votre historique d'ecoute</Text>
      {chargement && <ActivityIndicator color={COLORS.musique} style={{ marginTop: 20 }} />}
      <FlatList
                style={{ flex: 1 }}
        data={titres}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.ligne} onPress={() => navigation.navigate('TitreDetail', { id: item.id })}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ligneTitre}>{item.nom}</Text>
              <Text style={styles.ligneMeta}>{item.artiste} · {item.genre}</Text>
            </View>
            <Text style={styles.prix}>{item.gratuit ? 'Gratuit' : `${item.prixFcfa} FCFA`}</Text>
          </Pressable>
        )}
        ListEmptyComponent={!chargement && <Text style={styles.vide}>Ecoutez quelques titres pour recevoir des recommandations personnalisees.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="musique" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 20, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10, textAlign: 'center' },
  sousTitre: { color: COLORS.texteAtténué, fontSize: 12, paddingHorizontal: 16, marginTop: 6, textAlign: 'center', marginBottom: 10 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 30 },
  ligne: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 14, marginBottom: 10 },
  ligneTitre: { color: '#fff', fontWeight: '700', fontSize: 14 },
  ligneMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
  prix: { color: COLORS.musique, fontWeight: '700', fontSize: 13 },
});
