import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import { LinearGradient } from 'expo-linear-gradient';
import IconePlaceholder from '../../components/IconePlaceholder';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/** Vitrine d'un vendeur precis : son catalogue complet (section 8.1, marketplace multi-vendeurs). */
export default function BoutiqueVendeurScreen({ navigation, route }) {
  const { vendeurId } = route.params;
  const [vendeur, setVendeur] = useState(null);
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: v }, { data: p }] = await Promise.all([
          client.get(`/api/boutique/vendeurs/${vendeurId}`),
          client.get('/api/boutique/produits', { params: { vendeurId, page: 0, size: 50 } }),
        ]);
        setVendeur(v);
        setProduits(p.content || []);
      } finally {
        setChargement(false);
      }
    })();
  }, [vendeurId]);

  if (chargement) return <ActivityIndicator color={COLORS.boutique} style={{ marginTop: 40 }} />;
  if (!vendeur) return null;

  return (
    <LinearGradient colors={['#2A1A05', '#150C02', COLORS.fond]} style={styles.safe}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={styles.entete}>
        <Text style={styles.nom}>{vendeur.nomBoutique}</Text>
        <Text style={styles.categorie}>{vendeur.categorie}</Text>
      </View>

      <FlatList
                style={{ flex: 1 }}
        data={produits}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        contentContainerStyle={{ padding: 16 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <Pressable style={styles.carte} onPress={() => navigation.navigate('ProduitDetail', { id: item.id })}>
            {item.imageUrl ? <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.image} /> : <IconePlaceholder style={styles.image} />}
            <Text style={styles.carteTitre} numberOfLines={1}>{item.nom}</Text>
            <Text style={styles.cartePrix}>{item.prixFcfa} FCFA</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.vide}>Cette boutique n'a pas encore de produits.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="boutique" />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  entete: { paddingHorizontal: 16, paddingTop: 10 },
  nom: { color: '#fff', fontSize: 22, fontWeight: '800' },
  categorie: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  carte: { width: '48%', backgroundColor: COLORS.fondCarte, borderRadius: 14, padding: 10, marginBottom: 14 },
  image: { width: '100%', height: 100, borderRadius: 10, marginBottom: 8 },
  carteTitre: { color: '#fff', fontWeight: '600', fontSize: 13 },
  cartePrix: { color: COLORS.boutique, fontWeight: '700', fontSize: 13, marginTop: 4 },
});
