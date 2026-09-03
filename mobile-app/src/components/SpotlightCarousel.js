import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../api/client';
import { COLORS } from '../theme/colors';
import { resoudreUrlImage } from '../utils/urlImage';
import IconePlaceholder from './IconePlaceholder';

/**
 * Bandeau "SPOTLIGHT" en haut du Hub, defilant automatiquement : melange
 * les actualites (recentes, pas seulement "a la une") ET les evenements
 * (a venir, en direct, et deja passes/replay), tries du plus recent au
 * plus ancien. Un seul carrousel plutot que deux separes, avec un badge
 * indiquant le type de chaque carte.
 */
export default function SpotlightCarousel({ navigation }) {
  const { width } = useWindowDimensions();
  const largeurCarte = width - 40;
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const listeRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const [articlesResultat, evenementsResultats] = await Promise.all([
          client.get('/api/media/articles', { params: { page: 0, size: 8 } }).catch(() => ({ data: { content: [] } })),
          Promise.all(
            ['A_VENIR', 'EN_DIRECT', 'TERMINE'].map((statut) =>
              client.get('/api/live/evenements', { params: { statut, page: 0, size: 4 } }).catch(() => ({ data: { content: [] } }))
            )
          ),
        ]);

        const articles = (articlesResultat.data.content || []).map((a) => ({
          type: 'article',
          id: `article-${a.id}`,
          refId: a.id,
          titre: a.titre,
          sousTitre: a.categorie,
          imageUrl: a.imageUrl,
          date: a.datePublication,
        }));

        const evenements = evenementsResultats.flatMap((r) => r.data.content || []).map((e) => ({
          type: 'evenement',
          id: `evenement-${e.id}`,
          refId: e.id,
          titre: e.titre,
          sousTitre: e.lieu,
          imageUrl: e.imageUrl,
          date: e.dateDebut,
          statut: e.statut,
        }));

        const tout = [...articles, ...evenements].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        setItems(tout.slice(0, 12));
      } catch {
        setItems([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const intervalle = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % items.length;
      setIndex(indexRef.current);
      listeRef.current?.scrollToOffset({ offset: indexRef.current * largeurCarte, animated: true });
    }, 4000);
    return () => clearInterval(intervalle);
  }, [items, largeurCarte]);

  if (items.length === 0) return null;

  const ouvrir = (item) => {
    if (item.type === 'article') navigation.navigate('ArticleDetail', { id: item.refId });
    else navigation.navigate('EvenementDetail', { id: item.refId });
  };

  const libelleBadge = (item) => {
    if (item.type === 'article') return 'ACTUALITE';
    if (item.statut === 'EN_DIRECT') return 'EN DIRECT';
    if (item.statut === 'TERMINE') return 'REPLAY';
    return 'EVENEMENT';
  };

  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>SPOTLIGHT</Text>
      <FlatList
        ref={listeRef}
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        snapToInterval={largeurCarte}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          indexRef.current = Math.round(e.nativeEvent.contentOffset.x / largeurCarte);
          setIndex(indexRef.current);
        }}
        renderItem={({ item }) => (
          <Pressable style={[styles.carte, { width: largeurCarte }]} onPress={() => ouvrir(item)}>
            {item.imageUrl ? (
              <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.image} />
            ) : (
              <IconePlaceholder style={styles.image} />
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} locations={[0.35, 1]} style={styles.degrade} />
            <View style={[styles.badge, item.statut === 'EN_DIRECT' && styles.badgeDirect]}>
              <Text style={styles.badgeTexte}>{libelleBadge(item)}</Text>
            </View>
            <View style={styles.texteConteneur}>
              <Text style={styles.carteTitre} numberOfLines={2}>{item.titre}</Text>
              {item.sousTitre && <Text style={styles.carteSousTitre} numberOfLines={1}>{item.sousTitre}</Text>}
            </View>
          </Pressable>
        )}
      />
      <View style={styles.pastilles}>
        {items.map((i) => (
          <View key={i.id} style={[styles.pastille, i === items[index] && styles.pastilleActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { marginBottom: 22 },
  titre: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 10 },
  carte: { height: 160, borderRadius: 16, overflow: 'hidden', backgroundColor: COLORS.fondCarte },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: COLORS.media, opacity: 0.35 },
  degrade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  badge: { position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.or, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeDirect: { backgroundColor: '#EF4444' },
  badgeTexte: { color: '#0A0A0F', fontSize: 10, fontWeight: '800' },
  texteConteneur: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  carteTitre: { color: '#fff', fontWeight: '700', fontSize: 15 },
  carteSousTitre: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  pastilles: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  pastille: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.bordure, marginHorizontal: 3 },
  pastilleActive: { backgroundColor: COLORS.or, width: 16 },
});
