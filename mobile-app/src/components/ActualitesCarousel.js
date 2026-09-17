import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, useWindowDimensions } from 'react-native';
import client from '../api/client';
import { COLORS } from '../theme/colors';

/**
 * Bandeau d'actualites qui defile automatiquement (section 4, "Media et
 * actualites") : les derniers articles publies, en carrousel auto-avance,
 * affiche en haut du Hub. Consultation libre, meme sans connexion.
 */
export default function ActualitesCarousel({ navigation }) {
  const { width } = useWindowDimensions();
  const largeurCarte = width - 40; // marge de 20 de chaque cote, alignee sur le contenu du Hub
  const [articles, setArticles] = useState([]);
  const [index, setIndex] = useState(0);
  const listeRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/api/media/articles', { params: { page: 0, size: 8 } });
        setArticles(data.content || []);
      } catch {
        // Pas de connexion / backend indisponible : le Hub reste utilisable, on masque juste le bandeau.
        setArticles([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (articles.length < 2) return;
    const intervalle = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % articles.length;
      setIndex(indexRef.current);
      listeRef.current?.scrollToOffset({ offset: indexRef.current * largeurCarte, animated: true });
    }, 4000);
    return () => clearInterval(intervalle);
  }, [articles, largeurCarte]);

  if (articles.length === 0) return null;

  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>A la une</Text>
      <FlatList
        ref={listeRef}
        data={articles}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(a) => String(a.id)}
        snapToInterval={largeurCarte}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          indexRef.current = Math.round(e.nativeEvent.contentOffset.x / largeurCarte);
          setIndex(indexRef.current);
        }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.carte, { width: largeurCarte }]}
            onPress={() => navigation.navigate('ArticleDetail', { id: item.id })}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]} />
            )}
            <View style={styles.degrade} />
            <View style={styles.texteConteneur}>
              <Text style={styles.categorie}>{item.categorie}</Text>
              <Text style={styles.carteTitre} numberOfLines={2}>{item.titre}</Text>
            </View>
          </Pressable>
        )}
      />
      <View style={styles.pastilles}>
        {articles.map((a, i) => (
          <View key={a.id} style={[styles.pastille, i === index && styles.pastilleActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { marginBottom: 22 },
  titre: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 10 },
  carte: { height: 150, borderRadius: 16, overflow: 'hidden', backgroundColor: COLORS.fondCarte },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: COLORS.media, opacity: 0.35 },
  degrade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  texteConteneur: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  categorie: { color: COLORS.or, fontSize: 10, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase' },
  carteTitre: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pastilles: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  pastille: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.bordure, marginHorizontal: 3 },
  pastilleActive: { backgroundColor: COLORS.or, width: 16 },
});
