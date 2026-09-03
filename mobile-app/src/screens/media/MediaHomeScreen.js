import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlayCircle, Star } from 'lucide-react-native';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';
import EnteteLogo from '../../components/EnteteLogo';
import IconePlaceholder from '../../components/IconePlaceholder';
import BarreRecherche from '../../components/BarreRecherche';
import MediaCarousel from '../../components/MediaCarousel';

const ONGLETS = [
  { cle: 'TOUT', label: 'Toutes' },
  { cle: 'A_LA_UNE', label: 'A la une' },
  { cle: 'VIDEO', label: 'Video/Clip' },
];

/** Rubrique 1, "Media et actualites" (section 4) : a la une, actualites, videos. Consultation libre. */
export default function MediaHomeScreen({ navigation }) {
  const { estConnecte } = useAuth();
  const [tousLesArticles, setTousLesArticles] = useState([]);
  const [onglet, setOnglet] = useState('TOUT');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [aDesRecommandations, setADesRecommandations] = useState(false);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/api/media/articles', { params: { page: 0, size: 40 } });
        let liste = data.content || [];

        // Recommandations personnalisees selon les artistes suivis (section 4.2) :
        // les articles lies a une chaine suivie remontent en tete de liste.
        if (estConnecte) {
          try {
            const { data: chaines } = await client.get('/api/live/mes-chaines-suivies');
            const nomsSuivis = new Set(chaines.map((c) => c.nom.toLowerCase()));
            if (nomsSuivis.size > 0) {
              const recommandes = liste.filter((a) => a.artisteLie && nomsSuivis.has(a.artisteLie.toLowerCase()));
              const autres = liste.filter((a) => !(a.artisteLie && nomsSuivis.has(a.artisteLie.toLowerCase())));
              if (recommandes.length > 0) {
                liste = [...recommandes, ...autres];
                setADesRecommandations(true);
              }
            }
          } catch {
            // Recommandation optionnelle : en cas d'echec, on garde l'ordre par defaut.
          }
        }
        setTousLesArticles(liste);
      } catch (e) {
        setErreur(e.message);
      } finally {
        setChargement(false);
      }
    })();
  }, [estConnecte]);

  const articlesAffiches = tousLesArticles
    .filter((a) => {
      if (onglet === 'TOUT') return true;
      if (onglet === 'A_LA_UNE') return a.aLaUne;
      return a.categorie === onglet;
    })
    .filter((a) => !recherche.trim() || a.titre?.toLowerCase().includes(recherche.trim().toLowerCase()));

  return (
    <ImageBackground source={require('../../../assets/images/scene_media.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <View style={styles.enteteLigne}>
        <Text style={styles.titre}>Media & actualites</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {!rechercheOuverte && (
            <>
              <BarreRecherche ouverte={false} onToggle={() => setRechercheOuverte(true)} />
              <Text style={styles.lienOffres} onPress={() => navigation.navigate('OffresPromotion')}>Offres de promotion</Text>
            </>
          )}
        </View>
      </View>
      {rechercheOuverte && (
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <BarreRecherche
            ouverte
            valeur={recherche}
            onChangeText={setRecherche}
            placeholder="Rechercher un article..."
            couleurAccent={COLORS.media}
            onToggle={() => setRechercheOuverte(false)}
          />
        </View>
      )}

      <MediaCarousel navigation={navigation} />

      <View style={styles.onglets}>
        {ONGLETS.map((item) => (
          <Pressable key={item.cle} onPress={() => setOnglet(item.cle)} style={[styles.onglet, onglet === item.cle && { borderColor: COLORS.media }]}>
            <Text style={[styles.ongletTexte, onglet === item.cle && { color: COLORS.media }]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      {chargement && <ActivityIndicator color={COLORS.media} style={{ marginTop: 20 }} />}
      {erreur && <Text style={styles.erreur}>{erreur}</Text>}
      {aDesRecommandations && onglet === 'TOUT' && <Text style={styles.banniereRecommandation}>Recommande selon les artistes que vous suivez</Text>}
      <FlatList
        data={articlesAffiches}
        style={{ flex: 1 }}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.carte} onPress={() => navigation.navigate('ArticleDetail', { id: item.id })}>
            <View>
              {item.imageUrl ? <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.image} /> : <IconePlaceholder style={styles.image} />}
              {item.categorie === 'VIDEO' && (
                <View style={styles.badgeLecture}>
                  <PlayCircle color="#fff" size={22} fill="rgba(0,0,0,0.4)" />
                </View>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              {item.aLaUne && (
                <View style={styles.badgeALaUne}>
                  <Star color={COLORS.or} size={10} fill={COLORS.or} />
                  <Text style={styles.badgeALaUneTexte}>A la une</Text>
                </View>
              )}
              <Text style={styles.carteTitre} numberOfLines={2}>{item.titre}</Text>
              <View style={styles.carteMetaLigne}>
                <View style={styles.pastilleCategorie}>
                  <Text style={styles.pastilleCategorieTexte}>{item.categorie}</Text>
                </View>
                <Text style={styles.carteVues}>{item.compteurVues} vues</Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={!chargement && <Text style={styles.vide}>{recherche ? 'Aucun resultat pour cette recherche.' : 'Aucun article dans cette categorie.'}</Text>}
      />
      <BottomTabBar navigation={navigation} variante="media" ongletActif="rubrique" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  enteteLogo: { paddingHorizontal: 16, paddingTop: 6 },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800' },
  enteteLigne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  lienOffres: { color: COLORS.media, fontSize: 12, fontWeight: '600' },
  onglet: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.bordure, marginRight: 8, marginBottom: 8 },
  onglets: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 12 },
  ongletTexte: { color: COLORS.texteAtténué, fontSize: 13 },
  erreur: { color: '#F87171', paddingHorizontal: 16, marginTop: 10 },
  banniereRecommandation: { color: COLORS.media, fontSize: 12, fontWeight: '600', paddingHorizontal: 16, marginTop: 10 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  carte: {
    flexDirection: 'row', backgroundColor: COLORS.fondCarte, borderRadius: 14, padding: 10, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.bordure,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  image: { width: 80, height: 80, borderRadius: 10 },
  badgeLecture: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  badgeALaUne: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  badgeALaUneTexte: { color: COLORS.or, fontSize: 10, fontWeight: '700' },
  carteTitre: { color: '#fff', fontWeight: '700', fontSize: 14 },
  carteMetaLigne: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  pastilleCategorie: { backgroundColor: 'rgba(59,130,246,0.18)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  pastilleCategorieTexte: { color: COLORS.media, fontSize: 10, fontWeight: '700' },
  carteVues: { color: COLORS.texteAtténué, fontSize: 12 },
});
