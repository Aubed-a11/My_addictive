import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';
import EnteteLogo from '../../components/EnteteLogo';
import IconePlaceholder from '../../components/IconePlaceholder';
import BarreRecherche from '../../components/BarreRecherche';
import LiveCarousel from '../../components/LiveCarousel';

const FILTRES = [
  { cle: null, label: 'Tous' },
  { cle: 'A_VENIR', label: 'A venir' },
  { cle: 'EN_DIRECT', label: 'En direct' },
  { cle: 'REPLAY', label: 'Replay' },
];

const LIBELLES_STATUT = { A_VENIR: 'A venir', EN_DIRECT: 'En direct', TERMINE: 'Termine', REPLAY: 'Replay' };

/** Rubrique 3, "Billetterie et live" (section 6). */
export default function EvenementsListeScreen({ navigation, route }) {
  const mode = route?.params?.mode; // 'billetterie' | 'live' | undefined (ex. venu de la barre de navigation, sans tuile d'origine)
  const titreEcran = mode === 'live' ? 'Live' : mode === 'billetterie' ? 'Billetterie' : 'Billetterie & Live';
  // En mode Live, "A venir" n'a pas sa place (ce sont des evenements pas encore
  // diffuses) : seuls Tous (= tous les contenus live), En direct et Replay
  // ont un sens ici. En mode Billetterie (ou par defaut), les quatre filtres
  // habituels restent disponibles.
  const filtresAffiches = mode === 'live'
    ? FILTRES.filter((f) => f.cle !== 'A_VENIR').map((f) => (f.cle === null ? { ...f, label: 'Tous les lives' } : f))
    : FILTRES;
  const [filtre, setFiltre] = useState(null);
  const [evenements, setEvenements] = useState([]);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/live/evenements', { params: { statut: filtre || undefined, page: 0, size: 30 } });
      setEvenements(data.content || []);
    })();
  }, [filtre]);

  const evenementsAffiches = evenements
    // En mode Live avec le filtre "Tous", on exclut les evenements pas encore
    // diffuses : la Billetterie, elle, les affiche normalement (c'est meme
    // souvent l'essentiel de son usage, reserver une place a l'avance).
    .filter((e) => !(mode === 'live' && filtre === null && e.statut === 'A_VENIR'))
    .filter((e) => !recherche.trim() || e.titre?.toLowerCase().includes(recherche.trim().toLowerCase()) || e.lieu?.toLowerCase().includes(recherche.trim().toLowerCase()));

  return (
    <ImageBackground source={require('../../../assets/images/scene_bienvenue.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <View style={styles.enteteLigne}>
        <Text style={styles.titre}>{titreEcran}</Text>
        {!rechercheOuverte && <BarreRecherche ouverte={false} onToggle={() => setRechercheOuverte(true)} />}
      </View>
      {rechercheOuverte && (
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <BarreRecherche
            ouverte
            valeur={recherche}
            onChangeText={setRecherche}
            placeholder="Rechercher un evenement..."
            couleurAccent={COLORS.billetterie}
            onToggle={() => setRechercheOuverte(false)}
          />
        </View>
      )}
      <LiveCarousel navigation={navigation} />
      <View style={styles.filtres}>
        {filtresAffiches.map((f) => (
          <Pressable key={f.label} onPress={() => setFiltre(f.cle)} style={[styles.filtre, filtre === f.cle && { borderColor: COLORS.billetterie }]}>
            <Text style={[styles.filtreTexte, filtre === f.cle && { color: COLORS.billetterie }]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.liensRapides}>
        <Pressable onPress={() => navigation.navigate('MesBillets')}><Text style={styles.lien}>Mes billets</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('Favoris')}><Text style={styles.lien}>Favoris</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('Chaines')}><Text style={styles.lien}>Chaines</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('Podcasts')}><Text style={styles.lien}>Podcasts</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('CreerEvenement')}><Text style={styles.lien}>Creer</Text></Pressable>
      </View>
      <FlatList
                style={{ flex: 1 }}
        data={evenementsAffiches}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.carte} onPress={() => navigation.navigate('EvenementDetail', { id: item.id })}>
            {item.imageUrl ? <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.image} /> : <IconePlaceholder style={styles.image} />}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.carteTitre}>{item.titre}</Text>
              <Text style={styles.carteMeta}>{item.lieu}</Text>
              <View style={[styles.pastilleStatut, item.statut === 'EN_DIRECT' && styles.pastilleStatutDirect]}>
                <Text style={[styles.statutTexte, item.statut === 'EN_DIRECT' && { color: '#fff' }]}>
                  {LIBELLES_STATUT[item.statut] || item.statut}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.vide}>{recherche ? 'Aucun resultat pour cette recherche.' : 'Aucun evenement pour ce filtre.'}</Text>}
      />
      <BottomTabBar navigation={navigation} variante="live" ongletActif="live" />
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
  lien: { color: COLORS.billetterie, fontSize: 13, fontWeight: '600' },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  carte: {
    flexDirection: 'row', backgroundColor: COLORS.fondCarte, borderRadius: 14, padding: 10, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.bordure,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  image: { width: 80, height: 80, borderRadius: 10 },
  carteTitre: { color: '#fff', fontWeight: '700', fontSize: 14 },
  carteMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
  pastilleStatut: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  pastilleStatutDirect: { backgroundColor: '#EF4444' },
  statutTexte: { fontSize: 10, fontWeight: '700', color: COLORS.texteAtténué },
});
