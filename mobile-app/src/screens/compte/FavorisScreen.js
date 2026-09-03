import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, FlatList, View, Pressable, Image, ImageBackground, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Music, Newspaper, Ticket, ShoppingBag, Trash2 } from 'lucide-react-native';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import EnteteLogo from '../../components/EnteteLogo';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

// Chaque type de favori a son propre endpoint de detail, son ecran de destination,
// et une image/titre/sous-titre a extraire de la reponse : centralise ici pour eviter
// de repeter cette logique quatre fois dans le rendu.
const CONFIG_TYPE = {
  TITRE: {
    Icone: Music, couleur: COLORS.musique, ecran: 'TitreDetail',
    charger: (id) => client.get(`/api/musique/titres/${id}`),
    extraire: (d) => ({ titre: d.nom, sousTitre: d.artiste, image: d.imageUrl }),
  },
  ARTICLE: {
    Icone: Newspaper, couleur: COLORS.media, ecran: 'ArticleDetail',
    charger: (id) => client.get(`/api/media/articles/${id}`),
    extraire: (d) => ({ titre: d.titre, sousTitre: d.categorie, image: d.imageUrl }),
  },
  EVENEMENT: {
    Icone: Ticket, couleur: COLORS.billetterie, ecran: 'EvenementDetail',
    charger: (id) => client.get(`/api/live/evenements/${id}`),
    extraire: (d) => ({ titre: d.titre, sousTitre: d.lieu, image: d.imageUrl }),
  },
  PRODUIT: {
    Icone: ShoppingBag, couleur: COLORS.boutique, ecran: 'ProduitDetail',
    charger: (id) => client.get(`/api/boutique/produits/${id}`),
    extraire: (d) => ({ titre: d.nom, sousTitre: `${d.prixFcfa} FCFA`, image: d.imageUrl }),
  },
};

/** Liste des favoris (section 9.2), tous types de contenus confondus : charge le detail reel de chaque element pour l'afficher et permettre d'y naviguer. */
export default function FavorisScreen({ navigation }) {
  const [favoris, setFavoris] = useState([]);
  const [chargement, setChargement] = useState(true);

  const charger = async () => {
    setChargement(true);
    try {
      const { data } = await client.get('/api/compte/favoris');
      const enrichis = await Promise.all(
        (data || []).map(async (f) => {
          const config = CONFIG_TYPE[f.typeCible];
          if (!config) return { ...f, titre: f.typeCible, sousTitre: `Reference #${f.referenceId}` };
          try {
            const { data: detail } = await config.charger(f.referenceId);
            return { ...f, ...config.extraire(detail) };
          } catch {
            return { ...f, titre: 'Contenu indisponible', sousTitre: 'Cet element a peut-etre ete supprime' };
          }
        })
      );
      setFavoris(enrichis);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const retirer = async (favoriId) => {
    setFavoris((precedent) => precedent.filter((f) => f.id !== favoriId));
    try { await client.delete(`/api/compte/favoris/${favoriId}`); } catch { charger(); }
  };

  const ouvrir = (item) => {
    const config = CONFIG_TYPE[item.typeCible];
    if (!config) return;
    navigation.navigate(config.ecran, { id: item.referenceId });
  };

  return (
    <ImageBackground source={require('../../../assets/images/scene_hub.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <Text style={styles.titre}>Mes favoris</Text>
      {chargement && <ActivityIndicator color={COLORS.or} style={{ marginTop: 20 }} />}
      <FlatList
        style={{ flex: 1 }}
        data={favoris}
        keyExtractor={(f) => String(f.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        renderItem={({ item }) => {
          const config = CONFIG_TYPE[item.typeCible];
          return (
            <Pressable style={styles.carte} onPress={() => ouvrir(item)}>
              {item.image ? (
                <Image source={{ uri: resoudreUrlImage(item.image) }} style={styles.vignette} />
              ) : (
                <IconePlaceholder style={styles.vignette} tailleIcone="55%" />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.ligneType}>
                  {config && <config.Icone size={12} color={config.couleur} />}
                  <Text style={[styles.typeTexte, config && { color: config.couleur }]}>{item.typeCible}</Text>
                </View>
                <Text style={styles.carteTitre} numberOfLines={1}>{item.titre}</Text>
                <Text style={styles.carteMeta} numberOfLines={1}>{item.sousTitre}</Text>
              </View>
              <Pressable hitSlop={10} onPress={() => retirer(item.id)} style={{ padding: 6 }}>
                <Trash2 color={COLORS.texteAtténué} size={18} />
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={!chargement && <Text style={styles.vide}>Aucun favori pour le moment.</Text>}
      />
      <BottomTabBar navigation={navigation} variante="compte" />
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
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 10, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3,
  },
  vignette: { width: 52, height: 52, borderRadius: 8 },
  ligneType: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  typeTexte: { fontSize: 10, fontWeight: '700', color: COLORS.texteAtténué },
  carteTitre: { color: '#fff', fontWeight: '700', fontSize: 14 },
  carteMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 2 },
});
