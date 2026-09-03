import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image, ImageBackground, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart } from 'lucide-react-native';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';
import EnteteLogo from '../../components/EnteteLogo';
import IconePlaceholder from '../../components/IconePlaceholder';
import BarreRecherche from '../../components/BarreRecherche';
import MusiqueCarousel from '../../components/MusiqueCarousel';

const ONGLETS = [
  { cle: 'gratuit', label: 'Free Music' },
  { cle: 'payant', label: 'Music Store' },
];

/** Rubrique 2, "Musique" (section 5). Radio non implementee dans cette iteration. */
export default function MusiqueHomeScreen({ navigation }) {
  const { estConnecte } = useAuth();
  const [onglet, setOnglet] = useState('gratuit');
  const [titres, setTitres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [favoris, setFavoris] = useState(new Map()); // titreId (string) -> id du Favori (pour la suppression)
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [recherche, setRecherche] = useState('');

  const charger = useCallback(async (o) => {
    setChargement(true);
    try {
      const { data } = await client.get('/api/musique/titres', { params: { gratuit: o === 'gratuit', page: 0, size: 30 } });
      setTitres(data.content || []);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => { charger(onglet); }, [onglet, charger]);

  const titresAffiches = recherche.trim()
    ? titres.filter((t) =>
        t.nom?.toLowerCase().includes(recherche.trim().toLowerCase()) ||
        t.artiste?.toLowerCase().includes(recherche.trim().toLowerCase())
      )
    : titres;

  useEffect(() => {
    if (!estConnecte) return;
    (async () => {
      try {
        const { data } = await client.get('/api/compte/favoris');
        const carte = new Map();
        (data || []).filter((f) => f.typeCible === 'TITRE').forEach((f) => carte.set(f.referenceId, f.id));
        setFavoris(carte);
      } catch {}
    })();
  }, [estConnecte]);

  const basculerFavori = async (titreId) => {
    if (!estConnecte) {
      navigation.navigate('Connexion');
      return;
    }
    const id = String(titreId);
    const favoriIdExistant = favoris.get(id);

    if (favoriIdExistant) {
      // Retrait : mise a jour optimiste, puis appel reel.
      setFavoris((precedent) => {
        const suivant = new Map(precedent);
        suivant.delete(id);
        return suivant;
      });
      try {
        await client.delete(`/api/compte/favoris/${favoriIdExistant}`);
      } catch {
        setFavoris((precedent) => new Map(precedent).set(id, favoriIdExistant));
      }
    } else {
      try {
        const { data } = await client.post('/api/compte/favoris', { typeCible: 'TITRE', referenceId: id });
        setFavoris((precedent) => new Map(precedent).set(id, data.id));
      } catch {}
    }
  };

  return (
    <ImageBackground source={require('../../../assets/images/scene_musique.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <View style={styles.enteteTitreLigne}>
        {!rechercheOuverte && <Text style={styles.titre}>Musique</Text>}
        <View style={rechercheOuverte ? { flex: 1 } : null}>
          <BarreRecherche
            ouverte={rechercheOuverte}
            onToggle={() => setRechercheOuverte(!rechercheOuverte)}
            valeur={recherche}
            onChangeText={setRecherche}
            placeholder="Titre, artiste..."
            couleurAccent={COLORS.musique}
          />
        </View>
      </View>

      <MusiqueCarousel navigation={navigation} />
      <View style={styles.onglets}>
        {ONGLETS.map((o) => (
          <Pressable key={o.cle} onPress={() => setOnglet(o.cle)} style={[styles.onglet, onglet === o.cle && { borderColor: COLORS.musique }]}>
            <Text style={[styles.ongletTexte, onglet === o.cle && { color: COLORS.musique }]}>{o.label}</Text>
          </Pressable>
        ))}
        <Pressable style={styles.onglet} onPress={() => navigation.navigate('Chaines')}>
          <Text style={styles.ongletTexte}>Artistes</Text>
        </Pressable>
        <Pressable style={styles.onglet} onPress={() => navigation.navigate('Albums')}>
          <Text style={styles.ongletTexte}>Album/EP</Text>
        </Pressable>
        <Pressable style={styles.onglet} onPress={() => navigation.navigate('ClassementMusique')}>
          <Text style={styles.ongletTexte}>Nos Top</Text>
        </Pressable>
        <Pressable style={styles.onglet} onPress={() => navigation.navigate('Recommandations')}>
          <Text style={styles.ongletTexte}>Pour vous</Text>
        </Pressable>
        <Pressable style={styles.onglet} onPress={() => Alert.alert('Bientot disponible', "Le classement par genre musical n'est pas encore disponible : aucune donnee de genre n'existe pour l'instant dans le catalogue.")}>
          <Text style={styles.ongletTexte}>Nos Genres</Text>
        </Pressable>
        <Pressable style={styles.onglet} onPress={() => Alert.alert('Bientot disponible', "Les bonus sons ne sont pas encore une categorie definie cote serveur.")}>
          <Text style={styles.ongletTexte}>Bonus Sons</Text>
        </Pressable>
        <Pressable style={styles.onglet} onPress={() => navigation.navigate('HistoriqueEcoute')}>
          <Text style={styles.ongletTexte}>Mon Historique</Text>
        </Pressable>
      </View>

      {chargement && <ActivityIndicator color={COLORS.musique} style={{ marginTop: 20 }} />}

      <FlatList
                style={{ flex: 1 }}
        data={titresAffiches}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.ligne} onPress={() => navigation.navigate('TitreDetail', { id: item.id })}>
            {item.imageUrl ? (
              <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.pochette} />
            ) : (
              <IconePlaceholder style={styles.pochette} />
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.ligneTitre}>{item.nom}</Text>
              <Text style={styles.ligneMeta}>{item.artiste} · {item.genre || 'Genre non precise'}</Text>
            </View>
            <Pressable hitSlop={10} onPress={() => basculerFavori(item.id)} style={{ marginRight: 10 }}>
              <Heart
                size={18}
                color={favoris.has(String(item.id)) ? COLORS.musique : COLORS.texteAtténué}
                fill={favoris.has(String(item.id)) ? COLORS.musique : 'none'}
              />
            </Pressable>
            <Text style={styles.prix}>{item.gratuit ? 'Gratuit' : `${item.prixFcfa} FCFA`}</Text>
          </Pressable>
        )}
        ListEmptyComponent={!chargement && <Text style={styles.vide}>{recherche ? 'Aucun resultat pour cette recherche.' : 'Aucun titre pour le moment.'}</Text>}
      />
      <BottomTabBar navigation={navigation} variante="musique" ongletActif="rubrique" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800' },
  enteteTitreLigne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  onglets: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 12, gap: 8 },
  onglet: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.bordure },
  ongletTexte: { color: COLORS.texteAtténué, fontSize: 13 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  ligne: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 10, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.bordure,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3,
  },
  pochette: { width: 52, height: 52, borderRadius: 8 },
  ligneTitre: { color: '#fff', fontWeight: '700', fontSize: 14 },
  ligneMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
  prix: { color: COLORS.musique, fontWeight: '700', fontSize: 12, backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, overflow: 'hidden' },
});
