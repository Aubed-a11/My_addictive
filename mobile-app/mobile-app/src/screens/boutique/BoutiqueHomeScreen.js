import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import CompteARebours from '../../components/CompteARebours';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';
import EnteteLogo from '../../components/EnteteLogo';
import IconePlaceholder from '../../components/IconePlaceholder';
import BarreRecherche from '../../components/BarreRecherche';

const CATEGORIES = [null, 'MODE', 'HIGH_TECH', 'MAISON', 'BEAUTE', 'ALIMENTATION', 'ARTISANAT', 'MUSIQUE', 'AUTRE'];

/** Rubrique 5, "Boutique" (section 8) : marketplace generaliste multi-vendeurs, pas seulement musicale. */
export default function BoutiqueHomeScreen({ navigation }) {
  const [categorie, setCategorie] = useState(null);
  const [produits, setProduits] = useState([]);
  const [drops, setDrops] = useState([]);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/boutique/produits', { params: { categorie: categorie || undefined, page: 0, size: 30 } });
      setProduits(data.content || []);
    })();
  }, [categorie]);

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/boutique/produits/drops', { params: { page: 0, size: 10 } });
      setDrops(data.content || []);
    })();
  }, []);

  const produitsAffiches = recherche.trim()
    ? produits.filter((p) => p.nom?.toLowerCase().includes(recherche.trim().toLowerCase()))
    : produits;

  return (
    <LinearGradient colors={['#2A1A05', '#150C02', COLORS.fond]} style={styles.safe}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <View style={styles.entete}>
        <Text style={styles.titre}>Boutique</Text>
        <View style={styles.liensRapides}>
          {!rechercheOuverte && <BarreRecherche ouverte={false} onToggle={() => setRechercheOuverte(true)} />}
          <Pressable onPress={() => navigation.navigate('Favoris')}><Text style={styles.lien}>Favoris</Text></Pressable>
          <Pressable onPress={() => navigation.navigate('Panier')}><Text style={styles.lien}>Panier</Text></Pressable>
          <Pressable onPress={() => navigation.navigate('MesCommandes')}><Text style={styles.lien}>Commandes</Text></Pressable>
          <Pressable onPress={() => navigation.navigate('InscriptionVendeur')}><Text style={styles.lien}>Vendre</Text></Pressable>
        </View>
      </View>
      {rechercheOuverte && (
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <BarreRecherche
            ouverte
            valeur={recherche}
            onChangeText={setRecherche}
            placeholder="Rechercher un produit..."
            couleurAccent={COLORS.boutique}
            onToggle={() => setRechercheOuverte(false)}
          />
        </View>
      )}

      {drops.length > 0 && (
        <>
          <Text style={styles.sectionTitre}>Drops limites</Text>
          <FlatList
            horizontal
            data={drops}
            keyExtractor={(p) => String(p.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <Pressable style={styles.carteDrop} onPress={() => navigation.navigate('ProduitDetail', { id: item.id })}>
                {item.imageUrl ? <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.imageDrop} /> : <IconePlaceholder style={styles.imageDrop} />}
                <Text style={styles.carteTitre} numberOfLines={1}>{item.nom}</Text>
                <CompteARebours dateCible={item.dateDebutDrop} style={styles.compteARebours} />
              </Pressable>
            )}
          />
        </>
      )}

      <View style={styles.filtres}>
        {CATEGORIES.map((item) => (
          <Pressable key={String(item)} onPress={() => setCategorie(item)} style={[styles.filtre, categorie === item && { borderColor: COLORS.boutique }]}>
            <Text style={[styles.filtreTexte, categorie === item && { color: COLORS.boutique }]}>{item || 'Tout'}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={produitsAffiches}
        style={{ flex: 1 }}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <Pressable style={styles.carte} onPress={() => navigation.navigate('ProduitDetail', { id: item.id })}>
            {item.imageUrl ? <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.image} /> : <IconePlaceholder style={styles.image} />}
            <Text style={styles.carteTitre} numberOfLines={1}>{item.nom}</Text>
            <Text style={styles.cartePrix}>{item.prixFcfa} FCFA</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.vide}>Aucun produit dans cette categorie.</Text>}
      />
      <BottomTabBar navigation={navigation} variante="boutique" ongletActif="rubrique" />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  entete: { paddingHorizontal: 16, paddingTop: 10 },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800' },
  liensRapides: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10, alignItems: 'center' },
  lien: { color: COLORS.boutique, fontWeight: '600', fontSize: 13 },
  sectionTitre: { color: '#fff', fontWeight: '700', fontSize: 14, paddingHorizontal: 16, marginTop: 18, marginBottom: 8 },
  carteDrop: { width: 140, backgroundColor: COLORS.fondCarte, borderRadius: 14, padding: 10, marginRight: 12, borderWidth: 1, borderColor: COLORS.or },
  imageDrop: { width: '100%', height: 90, borderRadius: 10, marginBottom: 8 },
  compteARebours: { color: COLORS.or, fontSize: 11, fontWeight: '700', marginTop: 4 },
  filtre: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.bordure, marginRight: 8, marginBottom: 8 },
  filtres: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginTop: 16 },
  filtreTexte: { color: COLORS.texteAtténué, fontSize: 13 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  carte: { width: '48%', backgroundColor: COLORS.fondCarte, borderRadius: 14, padding: 10, marginBottom: 14 },
  image: { width: '100%', height: 100, borderRadius: 10, marginBottom: 8 },
  carteTitre: { color: '#fff', fontWeight: '600', fontSize: 13 },
  cartePrix: { color: COLORS.boutique, fontWeight: '700', fontSize: 13, marginTop: 4 },
});
