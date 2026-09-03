import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import client from '../api/client';
import { COLORS } from '../theme/colors';
import { resoudreUrlImage } from '../utils/urlImage';
import IconePlaceholder from './IconePlaceholder';

/**
 * Bandeau defilant en haut de "Competitions & Votes" : met en avant les
 * candidats actuellement en tete de chaque competition en cours (les plus
 * "actuels"), pour donner immediatement envie de voter.
 */
export default function VotesCarousel({ navigation }) {
  const { width } = useWindowDimensions();
  const largeurCarte = width - 40;
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const listeRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const { data: competitions } = await client.get('/api/votes/competitions', { params: { page: 0, size: 5 } });
        const resultats = await Promise.all(
          (competitions.content || []).map((c) =>
            client.get(`/api/votes/competitions/${c.id}/candidats`)
              .then((r) => ({ competition: c, candidats: r.data || [] }))
              .catch(() => ({ competition: c, candidats: [] }))
          )
        );
        const meneurs = resultats
          .filter((r) => r.candidats.length > 0)
          .map((r) => {
            const meneur = [...r.candidats].sort((a, b) => (b.noteJury || 0) - (a.noteJury || 0))[0];
            return { ...meneur, competitionNom: r.competition.nom, competitionId: r.competition.id };
          });
        setItems(meneurs.slice(0, 10));
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
          <Pressable
            style={[styles.carte, { width: largeurCarte }]}
            onPress={() => navigation.navigate('Candidats', { competitionId: item.competitionId, nom: item.competitionNom })}
          >
            {item.photoUrl ? (
              <Image source={{ uri: resoudreUrlImage(item.photoUrl) }} style={styles.image} />
            ) : (
              <IconePlaceholder style={styles.image} />
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} locations={[0.35, 1]} style={styles.degrade} />
            <View style={styles.badge}><Text style={styles.badgeTexte}>EN TETE</Text></View>
            <View style={styles.texteConteneur}>
              <Text style={styles.carteTitre} numberOfLines={1}>{item.nom}</Text>
              <Text style={styles.carteSousTitre} numberOfLines={1}>{item.competitionNom}</Text>
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
  badge: { position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.votes, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeTexte: { color: '#fff', fontSize: 10, fontWeight: '800' },
  texteConteneur: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  carteTitre: { color: '#fff', fontWeight: '700', fontSize: 15 },
  carteSousTitre: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  pastilles: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  pastille: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.bordure, marginHorizontal: 3 },
  pastilleActive: { backgroundColor: COLORS.votes, width: 16 },
});
