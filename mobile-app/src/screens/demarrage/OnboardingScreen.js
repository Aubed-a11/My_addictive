import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, useWindowDimensions, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChevronRight, Check, Newspaper, Music, Ticket, Radio, TrendingUp, ShoppingBag } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';

const TUILES_HUB = [
  { titre: 'Media', sousTitre: 'Actualites & videos', Icone: Newspaper, couleur: COLORS.media },
  { titre: 'Musique', sousTitre: 'Ecoutez & telechargez', Icone: Music, couleur: COLORS.musique },
  { titre: 'Billetterie', sousTitre: 'Concerts & evenements', Icone: Ticket, couleur: COLORS.billetterie },
  { titre: 'Livestream', sousTitre: 'Live & replays', Icone: Radio, couleur: COLORS.live },
  { titre: 'Votes', sousTitre: 'Soutenez vos favoris', Icone: TrendingUp, couleur: COLORS.votes },
  { titre: 'Boutique', sousTitre: 'Produits exclusifs', Icone: ShoppingBag, couleur: COLORS.boutique },
];

const PAGES = [
  {
    cle: 'bienvenue',
    titre: 'Bienvenue sur',
    titreAccent: 'Addictive',
    texte: 'La plateforme tout-en-un dediee a la musique, aux evenements, aux artistes et a vous.',
    photo: require('../../../assets/images/scene_bienvenue.jpg'),
  },
  {
    cle: 'univers',
    titre: 'Tout votre univers',
    titreAccent: 'dans une seule app',
    texte: 'Actualites, musique, evenements, votes et boutique.',
    grille: true,
    photo: require('../../../assets/images/scene_univers.jpg'),
  },
  {
    cle: 'connexion',
    titre: 'Vivez. Participez.',
    titreAccent: 'Connectez-vous.',
    texte: 'Rejoignez la communaute, participez aux evenements et faites entendre votre voix.',
    photo: require('../../../assets/images/scene_connexion.jpg'),
    // Les icones flottantes (coeur, etoile, musique, billet) sont deja
    // integrees a cette photo : pas besoin de les redessiner par-dessus.
    derniere: true,
  },
];

/** Onboarding (3 ecrans) affiche uniquement a la premiere ouverture de l'app. */
export default function OnboardingScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listeRef = useRef(null);

  const terminer = async () => {
    await AsyncStorage.setItem('onboarding_vu', '1');
    navigation.replace('Hub');
  };

  const suivant = () => {
    if (index >= PAGES.length - 1) { terminer(); return; }
    listeRef.current?.scrollToIndex({ index: index + 1 });
  };

  return (
    <View style={styles.conteneur}>
      <FlatList
        ref={listeRef}
        data={PAGES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(p) => p.cle}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => {
          const Conteneur = item.photo ? ImageBackground : LinearGradient;
          const propsConteneur = item.photo
            ? { source: item.photo, resizeMode: 'cover' }
            : { colors: item.degrade };
          return (
            <Conteneur {...propsConteneur} style={[styles.page, { width }]}>
              {item.photo && (
                <LinearGradient
                  colors={['transparent', 'rgba(10,10,15,0.35)', 'rgba(10,10,15,0.92)']}
                  style={StyleSheet.absoluteFillObject}
                  locations={[0, 0.55, 1]}
                />
              )}

              <Pressable style={styles.passer} onPress={terminer}>
                <Text style={styles.passerTexte}>Passer</Text>
              </Pressable>

              {item.grille ? (
                <View style={styles.grille}>
                  {TUILES_HUB.map((t) => (
                    <View key={t.titre} style={[styles.tuile, { borderColor: t.couleur }]}>
                      <View style={[styles.icone, { backgroundColor: t.couleur }]}>
                        <t.Icone color="#fff" size={18} />
                      </View>
                      <Text style={styles.tuileTitre}>{t.titre}</Text>
                      <Text style={styles.tuileSousTitre}>{t.sousTitre}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.illustration} />
              )}

              <View style={styles.bas}>
                <Text style={styles.titre}>{item.titre}</Text>
                <Text style={[styles.titre, styles.titreAccent]}>{item.titreAccent}</Text>
                <Text style={styles.texte}>{item.texte}</Text>

                <View style={styles.piedDePage}>
                  <View style={styles.pastilles}>
                    {PAGES.map((p, i) => (
                      <View key={p.cle} style={[styles.pastille, i === index && styles.pastilleActive]} />
                  ))}
                </View>
                <Pressable style={styles.boutonSuivant} onPress={suivant}>
                  {item.derniere ? <Check color="#0A0A0F" size={22} /> : <ChevronRight color="#0A0A0F" size={22} />}
                </Pressable>
              </View>
            </View>
          </Conteneur>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: COLORS.fond },
  page: { flex: 1, paddingTop: 60, paddingHorizontal: 24, justifyContent: 'space-between', overflow: 'hidden' },
  passer: { alignSelf: 'flex-end' },
  passerTexte: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  illustration: { flex: 1 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20 },
  tuile: { width: '48%', height: 100, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 14 },
  icone: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  tuileTitre: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tuileSousTitre: { color: COLORS.texteAtténué, fontSize: 11, marginTop: 2 },
  bas: { paddingBottom: 30 },
  titre: { color: '#fff', fontSize: 24, fontWeight: '800' },
  titreAccent: { color: COLORS.or },
  texte: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 10, lineHeight: 19 },
  piedDePage: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26 },
  pastilles: { flexDirection: 'row' },
  pastille: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', marginRight: 6 },
  pastilleActive: { backgroundColor: COLORS.or, width: 18 },
  boutonSuivant: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.or, alignItems: 'center', justifyContent: 'center' },
});
