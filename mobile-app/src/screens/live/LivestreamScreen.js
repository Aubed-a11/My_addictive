import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlayCircle } from 'lucide-react-native';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';
import EnteteLogo from '../../components/EnteteLogo';
import IconePlaceholder from '../../components/IconePlaceholder';
import LiveCarousel from '../../components/LiveCarousel';

const FILTRES = [
  { cle: null, label: 'Tous les lives' },
  { cle: 'EN_DIRECT', label: 'En direct' },
  { cle: 'REPLAY', label: 'Replay' },
];

/**
 * Rubrique Livestream : visionnage de contenu en direct ou en replay,
 * distincte de la Billetterie (EvenementsListeScreen.js) qui se concentre
 * elle sur l'achat de billets pour des evenements a venir.
 */
export default function LivestreamScreen({ navigation }) {
  const [filtre, setFiltre] = useState(null);
  const [evenements, setEvenements] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/live/evenements', { params: { statut: filtre || undefined, page: 0, size: 30 } });
      setEvenements(data.content || []);
    })();
  }, [filtre]);

  const evenementsAffiches = evenements.filter((e) => filtre !== null || e.statut !== 'A_VENIR');

  return (
    <ImageBackground source={require('../../../assets/images/scene_bienvenue.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <View style={styles.enteteLigne}>
        <Text style={styles.titre}>Livestream</Text>
      </View>

      <LiveCarousel navigation={navigation} />

      <View style={styles.filtres}>
        {FILTRES.map((f) => (
          <Pressable key={f.label} onPress={() => setFiltre(f.cle)} style={[styles.filtre, filtre === f.cle && { borderColor: COLORS.or }]}>
            <Text style={[styles.filtreTexte, filtre === f.cle && { color: COLORS.or }]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.liensRapides}>
        <Pressable onPress={() => navigation.navigate('Chaines')}><Text style={styles.lien}>Chaines</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('Podcasts')}><Text style={styles.lien}>Podcasts</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('Favoris')}><Text style={styles.lien}>Favoris</Text></Pressable>
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={evenementsAffiches}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.carte} onPress={() => navigation.navigate('EvenementDetail', { id: item.id })}>
            <View style={styles.imageConteneur}>
              {item.imageUrl ? <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.image} /> : <IconePlaceholder style={styles.image} />}
              <View style={styles.voileImage} />
              <PlayCircle color="#fff" size={30} style={styles.iconePlay} fill="rgba(0,0,0,0.35)" strokeWidth={1.5} />
              {item.statut === 'EN_DIRECT' && (
                <View style={styles.badgeDirect}><Text style={styles.badgeDirectTexte}>EN DIRECT</Text></View>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.carteTitre} numberOfLines={2}>{item.titre}</Text>
              <Text style={styles.carteMeta}>{item.lieu}</Text>
              <Text style={styles.regarder}>{item.statut === 'EN_DIRECT' ? 'Regarder en direct' : 'Voir le replay'}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={styles.vide}>Aucun contenu en direct ou en replay pour le moment.</Text>
            <Pressable onPress={() => navigation.navigate('EvenementsListe')} style={styles.boutonVide}>
              <Text style={styles.boutonVideTexte}>Voir les événements à venir</Text>
            </Pressable>
          </View>
        }
      />
      <BottomTabBar navigation={navigation} ongletActif="live" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800' },
  enteteLigne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  filtres: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 12 },
  filtre: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.bordure, marginRight: 8 },
  filtreTexte: { color: COLORS.texteAtténué, fontSize: 13 },
  liensRapides: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: 8, marginTop: 14 },
  lien: { color: COLORS.or, fontSize: 13, fontWeight: '600' },
  vide: { color: COLORS.texteAtténué, textAlign: 'center' },
  boutonVide: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: COLORS.or },
  boutonVideTexte: { color: COLORS.or, fontWeight: '700', fontSize: 13 },
  carte: {
    flexDirection: 'row', backgroundColor: COLORS.fondCarte, borderRadius: 14, padding: 10, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.bordure,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  imageConteneur: { width: 90, height: 90, borderRadius: 10, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  voileImage: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  iconePlay: { position: 'absolute', top: '50%', left: '50%', marginTop: -15, marginLeft: -15 },
  badgeDirect: { position: 'absolute', top: 4, left: 4, backgroundColor: '#EF4444', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  badgeDirectTexte: { color: '#fff', fontSize: 8, fontWeight: '800' },
  carteTitre: { color: '#fff', fontWeight: '700', fontSize: 14 },
  carteMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
  regarder: { color: COLORS.or, fontSize: 12, fontWeight: '700', marginTop: 8 },
});
