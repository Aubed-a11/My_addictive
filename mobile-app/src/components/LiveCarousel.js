import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../api/client';
import { COLORS } from '../theme/colors';
import { resoudreUrlImage } from '../utils/urlImage';
import IconePlaceholder from './IconePlaceholder';

/**
 * Bandeau defilant en haut de la Billetterie/Live : melange les evenements
 * en direct, a venir, et recemment termines (replay), tries pour mettre en
 * avant ce qui est le plus pertinent maintenant (en direct d'abord).
 */
export default function LiveCarousel({ navigation }) {
  const { width } = useWindowDimensions();
  const largeurCarte = width - 40;
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const listeRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const resultats = await Promise.all(
          ['EN_DIRECT', 'A_VENIR', 'TERMINE'].map((statut) =>
            client.get('/api/live/evenements', { params: { statut, page: 0, size: 5 } }).catch(() => ({ data: { content: [] } }))
          )
        );
        // En direct d'abord (le plus pertinent maintenant), puis a venir, puis recemment termine.
        const tout = resultats.flatMap((r) => r.data.content || []);
        setItems(tout.slice(0, 10));
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

  const libelleBadge = (statut) => {
    if (statut === 'EN_DIRECT') return 'EN DIRECT';
    if (statut === 'TERMINE') return 'REPLAY';
    return 'A VENIR';
  };

  return (
    <View style={styles.conteneur}>
      <FlatList
        ref={listeRef}
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => String(i.id)}
        snapToInterval={largeurCarte}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          indexRef.current = Math.round(e.nativeEvent.contentOffset.x / largeurCarte);
          setIndex(indexRef.current);
        }}
        renderItem={({ item }) => (
          <Pressable style={[styles.carte, { width: largeurCarte }]} onPress={() => navigation.navigate('EvenementDetail', { id: item.id })}>
            {item.imageUrl ? (
              <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.image} />
            ) : (
              <IconePlaceholder style={styles.image} />
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} locations={[0.35, 1]} style={styles.degrade} />
            <View style={[styles.badge, item.statut === 'EN_DIRECT' && styles.badgeDirect]}>
              <Text style={styles.badgeTexte}>{libelleBadge(item.statut)}</Text>
            </View>
            <View style={styles.texteConteneur}>
              <Text style={styles.carteTitre} numberOfLines={1}>{item.titre}</Text>
              <Text style={styles.carteSousTitre} numberOfLines={1}>{item.lieu}</Text>
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
  conteneur: { marginTop: 12, marginBottom: 6 },
  carte: { height: 150, borderRadius: 16, overflow: 'hidden', backgroundColor: COLORS.fondCarte },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  degrade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  badge: { position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.billetterie, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeDirect: { backgroundColor: '#EF4444' },
  badgeTexte: { color: '#fff', fontSize: 10, fontWeight: '800' },
  texteConteneur: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  carteTitre: { color: '#fff', fontWeight: '700', fontSize: 15 },
  carteSousTitre: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  pastilles: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  pastille: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.bordure, marginHorizontal: 3 },
  pastilleActive: { backgroundColor: COLORS.billetterie, width: 16 },
});
