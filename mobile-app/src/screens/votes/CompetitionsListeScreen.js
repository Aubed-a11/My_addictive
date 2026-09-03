import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';
import EnteteLogo from '../../components/EnteteLogo';
import BarreRecherche from '../../components/BarreRecherche';
import VotesCarousel from '../../components/VotesCarousel';

/** Rubrique 4, "Competitions et votes" (section 7) : pas seulement des concours musicaux. */
export default function CompetitionsListeScreen({ navigation }) {
  const [competitions, setCompetitions] = useState([]);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/votes/competitions', { params: { page: 0, size: 30 } });
      setCompetitions(data.content || []);
    })();
  }, []);

  const competitionsAffichees = recherche.trim()
    ? competitions.filter((c) => c.nom?.toLowerCase().includes(recherche.trim().toLowerCase()))
    : competitions;

  return (
    <ImageBackground source={require('../../../assets/images/scene_connexion.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
        <View style={styles.enteteLigne}>
          <Text style={styles.titre}>Competitions & Votes</Text>
          {!rechercheOuverte && <BarreRecherche ouverte={false} onToggle={() => setRechercheOuverte(true)} couleurAccent={COLORS.votes} />}
        </View>
        {rechercheOuverte && (
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <BarreRecherche
              ouverte
              valeur={recherche}
              onChangeText={setRecherche}
              placeholder="Rechercher une competition..."
              couleurAccent={COLORS.votes}
              onToggle={() => setRechercheOuverte(false)}
            />
          </View>
        )}
        <VotesCarousel navigation={navigation} />
        <Text style={styles.sousTitre}>Musique, entrepreneuriat, tech... soutenez vos favoris</Text>
        <View style={styles.liensRapides}>
          <Pressable onPress={() => navigation.navigate('Portefeuille')}>
            <Text style={styles.lien}>Mon portefeuille de pieces</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Favoris')}>
            <Text style={styles.lien}>Mes favoris</Text>
          </Pressable>
        </View>
        <FlatList
                    style={{ flex: 1 }}
          data={competitionsAffichees}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
          renderItem={({ item }) => (
            <Pressable style={styles.carte} onPress={() => navigation.navigate('Candidats', { competitionId: item.id, nom: item.nom })}>
              <View style={styles.ligneEntete}>
                <Text style={styles.carteTitre}>{item.nom}</Text>
                <View style={styles.badgeCategorie}>
                  <Text style={styles.badgeCategorieTexte}>{item.categorie || 'MUSIQUE'}</Text>
                </View>
              </View>
              <Text style={styles.carteMeta}>Saison {item.saison} · Phase : {item.phase}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.vide}>{recherche ? 'Aucun resultat pour cette recherche.' : 'Aucune competition en cours.'}</Text>}
        />
        <BottomTabBar navigation={navigation} variante="votes" ongletActif="votes" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800' },
  enteteLigne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  liensRapides: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  sousTitre: { color: COLORS.texteAtténué, fontSize: 12, paddingHorizontal: 16, marginTop: 4 },
  lien: { color: COLORS.votes, textAlign: 'center', marginTop: 10, fontWeight: '600' },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  carte: {
    backgroundColor: 'rgba(22,21,31,0.9)', borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3,
  },
  ligneEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  carteTitre: { color: '#fff', fontWeight: '700', flex: 1 },
  badgeCategorie: { backgroundColor: 'rgba(168,85,247,0.25)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  badgeCategorieTexte: { color: COLORS.votes, fontSize: 10, fontWeight: '700' },
  carteMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
});
