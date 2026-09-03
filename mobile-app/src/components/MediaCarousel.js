import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, useWindowDimensions } from 'react-native';
import client from '../api/client';
import { COLORS } from '../theme/colors';
import { resoudreUrlImage } from '../utils/urlImage';
import IconePlaceholder from './IconePlaceholder';

/** Bandeau defilant en haut de Media : articles a la une, les plus recents. */
export default function MediaCarousel({ navigation }) {
  const { width } = useWindowDimensions();
  const largeurCarte = width - 40;
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const listeRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/api/media/articles', { params: { aLaUne: true, page: 0, size: 10 } });
        let liste = data.content || [];
        if (liste.length === 0) {
          const { data: recents } = await client.get('/api/media/articles', { params: { page: 0, size: 10 } });
          liste = recents.content || [];
        }
        setItems(liste);
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
          <Pressable style={[styles.carte, { width: largeurCarte }]} onPress={() => navigation.navigate('ArticleDetail', { id: item.id })}>
            {item.imageUrl ? (
              <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.image} />
            ) : (
              <IconePlaceholder style={styles.image} />
            )}
            <View style={styles.degrade} />
            <View style={styles.badge}><Text style={styles.badgeTexte}>{item.categorie}</Text></View>
            <View style={styles.texteConteneur}>
              <Text style={styles.carteTitre} numberOfLines={2}>{item.titre}</Text>
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
  conteneur: { marginTop: 4, marginBottom: 6 },
  carte: { height: 150, borderRadius: 16, overflow: 'hidden', backgroundColor: COLORS.fondCarte },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  degrade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  badge: { position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.media, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeTexte: { color: '#fff', fontSize: 10, fontWeight: '800' },
  texteConteneur: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  carteTitre: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pastilles: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  pastille: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.bordure, marginHorizontal: 3 },
  pastilleActive: { backgroundColor: COLORS.media, width: 16 },
});
