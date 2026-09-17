import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, useWindowDimensions } from 'react-native';
import client from '../api/client';
import { COLORS } from '../theme/colors';

/**
 * Bandeau "evenements a venir" en haut du Hub, defilant automatiquement.
 * Alimente directement par le back-office (les evenements crees/programmes
 * depuis le dashboard admin ou par un organisateur en auto-service
 * apparaissent ici des qu'ils sont enregistres, statut A_VENIR).
 */
export default function EvenementsAVenirCarousel({ navigation }) {
  const { width } = useWindowDimensions();
  const largeurCarte = width - 40;
  const [evenements, setEvenements] = useState([]);
  const [index, setIndex] = useState(0);
  const listeRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/api/live/evenements', { params: { statut: 'A_VENIR', page: 0, size: 8 } });
        setEvenements(data.content || []);
      } catch {
        setEvenements([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (evenements.length < 2) return;
    const intervalle = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % evenements.length;
      setIndex(indexRef.current);
      listeRef.current?.scrollToOffset({ offset: indexRef.current * largeurCarte, animated: true });
    }, 4500);
    return () => clearInterval(intervalle);
  }, [evenements, largeurCarte]);

  if (evenements.length === 0) return null;

  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>Evenements a venir</Text>
      <FlatList
        ref={listeRef}
        data={evenements}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(e) => String(e.id)}
        snapToInterval={largeurCarte}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          indexRef.current = Math.round(e.nativeEvent.contentOffset.x / largeurCarte);
          setIndex(indexRef.current);
        }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.carte, { width: largeurCarte }]}
            onPress={() => navigation.navigate('EvenementDetail', { id: item.id })}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imagePlaceholder]} />
            )}
            <View style={styles.degrade} />
            <View style={styles.badgeDate}>
              <Text style={styles.badgeDateTexte}>
                {item.dateDebut ? new Date(item.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}
              </Text>
            </View>
            <View style={styles.texteConteneur}>
              <Text style={styles.carteTitre} numberOfLines={2}>{item.titre}</Text>
              <Text style={styles.carteLieu} numberOfLines={1}>{item.lieu}</Text>
            </View>
          </Pressable>
        )}
      />
      <View style={styles.pastilles}>
        {evenements.map((e, i) => (
          <View key={e.id} style={[styles.pastille, i === index && styles.pastilleActive]} />
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
  imagePlaceholder: { backgroundColor: COLORS.billetterie, opacity: 0.35 },
  degrade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  badgeDate: { position: 'absolute', top: 12, right: 12, backgroundColor: COLORS.or, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeDateTexte: { color: '#0A0A0F', fontSize: 11, fontWeight: '800' },
  texteConteneur: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  carteTitre: { color: '#fff', fontWeight: '700', fontSize: 16 },
  carteLieu: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 4 },
  pastilles: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  pastille: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.bordure, marginHorizontal: 3 },
  pastilleActive: { backgroundColor: COLORS.or, width: 16 },
});
