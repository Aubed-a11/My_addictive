import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/** Grille tarifaire de promotion pour les artistes (section 4.1) : Base, A1, A2, A3. */
export default function OffresPromotionScreen({ navigation }) {
  const [offres, setOffres] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/api/media/offres-promotion');
        setOffres(data);
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.titre}>Toutes nos offres de promotion</Text>
      <Text style={styles.sousTitre}>Mettez en avant votre musique et vos evenements aupres de notre audience.</Text>
      <FlatList
                style={{ flex: 1 }}
        data={offres}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.carte}>
            <View style={styles.enteteCarte}>
              <Text style={styles.code}>{item.code}</Text>
              <Text style={styles.prix}>{item.prixFcfa} FCFA</Text>
            </View>
            <Text style={styles.nom}>{item.nom}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.duree}>Duree : {item.dureeJours} jours</Text>
          </View>
        )}
        ListEmptyComponent={!chargement && <Text style={styles.vide}>Aucune offre disponible pour le moment.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="media" />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  titre: { color: '#fff', fontSize: 20, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10 },
  sousTitre: { color: COLORS.texteAtténué, fontSize: 12, paddingHorizontal: 16, marginTop: 6 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  carte: { backgroundColor: COLORS.fondCarte, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.bordure },
  enteteCarte: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  code: { color: COLORS.media, fontWeight: '800', fontSize: 13 },
  prix: { color: COLORS.or, fontWeight: '700', fontSize: 15 },
  nom: { color: '#fff', fontWeight: '700', fontSize: 15, marginTop: 8 },
  description: { color: COLORS.texteAtténué, fontSize: 13, marginTop: 6, lineHeight: 18 },
  duree: { color: COLORS.texteAtténué, fontSize: 11, marginTop: 8 },
});
