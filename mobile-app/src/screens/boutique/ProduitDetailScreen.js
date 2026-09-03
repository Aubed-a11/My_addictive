import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Store, Minus, Plus, Heart } from 'lucide-react-native';
import client from '../../api/client';
import PrimaryButton from '../../components/PrimaryButton';
import MessageErreur from '../../components/MessageErreur';
import CompteARebours from '../../components/CompteARebours';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import EnteteLogo from '../../components/EnteteLogo';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProduitDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { estConnecte } = useAuth();
  const [produit, setProduit] = useState(null);
  const [vendeur, setVendeur] = useState(null);
  const [quantite, setQuantite] = useState(1);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [favori, setFavori] = useState(false);
  const [favoriId, setFavoriId] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await client.get(`/api/boutique/produits/${id}`);
      setProduit(data);
      try {
        const { data: v } = await client.get(`/api/boutique/vendeurs/${data.vendeurId}`);
        setVendeur(v);
      } catch {}
    })();
  }, [id]);

  useEffect(() => {
    if (!estConnecte) return;
    (async () => {
      try {
        const { data: favoris } = await client.get('/api/compte/favoris');
        const existant = (favoris || []).find((f) => f.typeCible === 'PRODUIT' && f.referenceId === String(id));
        if (existant) { setFavori(true); setFavoriId(existant.id); }
      } catch {}
    })();
  }, [id, estConnecte]);

  const basculerFavori = async () => {
    if (!estConnecte) { navigation.navigate('Connexion', { returnTo: 'ProduitDetail', returnToParams: { id } }); return; }
    if (favori && favoriId) {
      setFavori(false);
      try { await client.delete(`/api/compte/favoris/${favoriId}`); } catch { setFavori(true); }
    } else {
      setFavori(true);
      try {
        const { data } = await client.post('/api/compte/favoris', { typeCible: 'PRODUIT', referenceId: String(id) });
        setFavoriId(data.id);
      } catch { setFavori(false); }
    }
  };

  const dropPasEncoreDisponible = produit?.dropLimite && produit.dateDebutDrop && new Date(produit.dateDebutDrop) > new Date();

  const ajouterAuPanier = async () => {
    if (!estConnecte) {
      navigation.navigate('Connexion', { returnTo: 'ProduitDetail', returnToParams: { id } });
      return;
    }
    setErreur(null);
    setChargement(true);
    try {
      await client.post('/api/boutique/panier', { produitId: id, quantite });
      setMessage('Ajoute au panier.');
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  if (!produit) return <ActivityIndicator color={COLORS.boutique} style={{ marginTop: 40 }} />;

  return (
    <LinearGradient colors={['#2A1A05', '#150C02', COLORS.fond]} style={styles.safe}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <ScrollView contentContainerStyle={{ paddingBottom: HAUTEUR_BARRE_ONGLETS + 20 }}>
        <View>
          {produit.imageUrl ? (
            <Image source={{ uri: resoudreUrlImage(produit.imageUrl) }} style={styles.image} />
          ) : (
            <IconePlaceholder style={styles.image} />
          )}
          <Pressable style={styles.boutonCoeur} onPress={basculerFavori}>
            <Heart size={18} color={favori ? COLORS.boutique : '#fff'} fill={favori ? COLORS.boutique : 'none'} />
          </Pressable>
        </View>

        <View style={{ padding: 20 }}>
          {produit.dropLimite && (
            <View style={styles.badgeDrop}>
              <Text style={styles.badgeDropTexte}>DROP LIMITE</Text>
            </View>
          )}
          <Text style={styles.titre}>{produit.nom}</Text>
          {vendeur && (
            <Pressable style={styles.ligneVendeur} onPress={() => navigation.navigate('BoutiqueVendeur', { vendeurId: produit.vendeurId })}>
              <Store color={COLORS.boutique} size={14} />
              <Text style={styles.venduPar}>Vendu par {vendeur.nomBoutique}</Text>
            </Pressable>
          )}
          <Text style={styles.prix}>{produit.prixFcfa} FCFA</Text>
          <Text style={styles.stock}>{produit.stock > 0 ? `${produit.stock} en stock` : 'Rupture de stock'}</Text>
          {produit.description && <Text style={styles.description}>{produit.description}</Text>}

          {dropPasEncoreDisponible && (
            <View style={styles.carteCompteARebours}>
              <Text style={styles.compteARebLabel}>Disponible dans :</Text>
              <CompteARebours dateCible={produit.dateDebutDrop} style={styles.compteARebValeur} />
            </View>
          )}

          <View style={styles.ligneQuantite}>
            <Text style={styles.libelleQuantite}>Quantite</Text>
            <View style={styles.selecteurQuantite}>
              <Pressable style={styles.boutonQuantite} onPress={() => setQuantite(Math.max(1, quantite - 1))}>
                <Minus color="#fff" size={16} />
              </Pressable>
              <Text style={styles.valeurQuantite}>{quantite}</Text>
              <Pressable style={styles.boutonQuantite} onPress={() => setQuantite(Math.min(produit.stock || 1, quantite + 1))}>
                <Plus color="#fff" size={16} />
              </Pressable>
            </View>
          </View>

          <MessageErreur message={erreur} />
          {message && <Text style={styles.message}>{message}</Text>}

          <PrimaryButton
            titre={dropPasEncoreDisponible ? 'Pas encore en vente' : `Ajouter au panier · ${produit.prixFcfa * quantite} FCFA`}
            couleur={COLORS.boutique}
            onPress={ajouterAuPanier}
            chargement={chargement}
            disabled={produit.stock <= 0 || dropPasEncoreDisponible}
          />
        </View>
      </ScrollView>
    <BottomTabBar navigation={navigation} variante="boutique" ongletActif="rubrique" />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  image: { width: '100%', aspectRatio: 1 },
  boutonCoeur: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  badgeDrop: { alignSelf: 'flex-start', backgroundColor: COLORS.or, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  badgeDropTexte: { color: '#0A0A0F', fontWeight: '800', fontSize: 11 },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800' },
  ligneVendeur: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  venduPar: { color: COLORS.boutique, fontSize: 13, fontWeight: '600' },
  prix: { color: COLORS.boutique, fontSize: 20, fontWeight: '700', marginTop: 8 },
  stock: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 6, marginBottom: 14 },
  description: { color: COLORS.texteAtténué, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  carteCompteARebours: { backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.or },
  compteARebLabel: { color: COLORS.texteAtténué, fontSize: 12 },
  compteARebValeur: { color: COLORS.or, fontSize: 18, fontWeight: '800', marginTop: 4 },
  ligneQuantite: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  libelleQuantite: { color: '#fff', fontWeight: '600', fontSize: 14 },
  selecteurQuantite: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: COLORS.fondCarte, borderRadius: 24, paddingHorizontal: 8, paddingVertical: 6 },
  boutonQuantite: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.boutique, alignItems: 'center', justifyContent: 'center' },
  valeurQuantite: { color: '#fff', fontWeight: '700', fontSize: 15, minWidth: 20, textAlign: 'center' },
  message: { color: COLORS.boutique, marginBottom: 10 },
});
