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

const FILTRES = [
  { cle: null, label: 'Tous' },
  { cle: 'A_VENIR', label: 'A venir' },
  { cle: 'TERMINE', label: 'Termines' },
];

const LIBELLES_STATUT = { A_VENIR: 'A venir', EN_DIRECT: 'En direct', TERMINE: 'Termine', REPLAY: 'Replay' };

/**
 * Rubrique Billetterie (section 6) : reservation de places pour des
 * evenements, a venir ou deja passes (historique). Distincte de l'ecran
 * Livestream (voir LivestreamScreen.js), qui se concentre lui sur le
 * visionnage immediat (en direct / replay) plutot que sur l'achat de
 * billet -- deux intentions differentes qui partageaient auparavant le
 * meme ecran, une confusion relevee par l'audit UX.
 */
export default function EvenementsListeScreen({ navigation }) {
  const [filtre, setFiltre] = useState(null);
  const [evenements, setEvenements] = useState([]);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    (async () => {
      try {
      const { data } = await client.get('/api/live/evenements', { params: { statut: filtre || undefined, page: 0, size: 30 } });
      setEvenements(data.content || []);
      } catch (e) {
        console.warn('[chargement] echec :', e && e.message);
      }
    })();
  }, [filtre]);

  const evenementsAffiches = evenements
    .filter((e) => !recherche.trim() || e.titre?.toLowerCase().includes(recherche.trim().toLowerCase()) || e.lieu?.toLowerCase().includes(recherche.trim().toLowerCase()));

  return (
    <ImageBackground source={require('../../../assets/images/scene_bienvenue.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <View style={styles.enteteLigne}>
        <Text style={styles.titre}>Billetterie</Text>
        {!rechercheOuverte && <BarreRecherche ouverte={false} onToggle={() => setRechercheOuverte(true)} />}
      </View>
      {rechercheOuverte && (
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <BarreRecherche
            ouverte
            valeur={recherche}
            onChangeText={setRecherche}
            placeholder="Rechercher un événement..."
            couleurAccent={COLORS.or}
            onToggle={() => setRechercheOuverte(false)}
          />
        </View>
      )}
      <View style={styles.filtres}>
        {FILTRES.map((f) => (
          <Pressable key={f.label} onPress={() => setFiltre(f.cle)} style={[styles.filtre, filtre === f.cle && { borderColor: COLORS.or }]}>
            <Text style={[styles.filtreTexte, filtre === f.cle && { color: COLORS.or }]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.liensRapides}>
        <Pressable onPress={() => navigation.navigate('MesBillets')}><Text style={styles.lien}>Mes billets</Text></Pressable>
        <Pressable onPress={() => navigation.navigate('CreerEvenement')}><Text style={styles.lien}>Creer un evenement</Text></Pressable>
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
              {item.dateDebut && (
                <Text style={styles.carteMeta}>
                  {new Date(item.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} a {new Date(item.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
              <View style={styles.ligneBas}>
                <View style={[styles.pastilleStatut, item.statut === 'EN_DIRECT' && styles.pastilleStatutDirect]}>
                  <Text style={[styles.statutTexte, item.statut === 'EN_DIRECT' && { color: '#fff' }]}>
                    {LIBELLES_STATUT[item.statut] || item.statut}
                  </Text>
                </View>
                {item.payant && <Text style={styles.prix}>{item.prixStandardFcfa?.toLocaleString('fr-FR')} FCFA</Text>}
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={styles.vide}>{recherche ? 'Aucun résultat pour cette recherche.' : 'Aucun événement pour ce filtre.'}</Text>
            <Pressable onPress={() => setFiltre(null)} style={styles.boutonVide}>
              <Text style={styles.boutonVideTexte}>Voir tous les événements</Text>
            </Pressable>
          </View>
        }
      />
      <BottomTabBar navigation={navigation} />
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
  image: { width: 80, height: 80, borderRadius: 10 },
  carteTitre: { color: '#fff', fontWeight: '700', fontSize: 14 },
  carteMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
  ligneBas: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  pastilleStatut: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pastilleStatutDirect: { backgroundColor: '#EF4444' },
  statutTexte: { fontSize: 10, fontWeight: '700', color: COLORS.texteAtténué },
  prix: { color: COLORS.or, fontWeight: '700', fontSize: 13 },
});
