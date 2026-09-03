import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2 } from 'lucide-react-native';
import client from '../../api/client';
import PrimaryButton from '../../components/PrimaryButton';
import MessageErreur from '../../components/MessageErreur';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import { LinearGradient } from 'expo-linear-gradient';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/** Panier multi-vendeurs (section 8.1) : la repartition entre vendeurs se fait automatiquement cote serveur. */
export default function PanierScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [validation, setValidation] = useState(false);

  const charger = useCallback(async () => {
    const { data } = await client.get('/api/boutique/panier');
    setItems(data);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const retirer = async (id) => {
    await client.delete(`/api/boutique/panier/${id}`);
    charger();
  };

  const valider = async () => {
    setErreur(null);
    setValidation(true);
    try {
      await client.post('/api/boutique/commandes/initier', { moyenPaiement: 'MTN_MOMO' });
      setMessage('Commande payee avec succes ! Retrouvez-la dans "Mes commandes".');
      charger();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setValidation(false);
    }
  };

  const total = items.reduce((somme, i) => somme + (i.prixFcfaProduit || 0) * i.quantite, 0);

  return (
    <LinearGradient colors={['#2A1A05', '#150C02', COLORS.fond]} style={styles.safe}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Text style={styles.titre}>Mon panier</Text>
      <MessageErreur message={erreur} />
      {message && <Text style={styles.message}>{message}</Text>}
      <FlatList
                style={{ flex: 1 }}
        data={items}
        keyExtractor={(i) => String(i.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.ligne}>
            {item.imageUrlProduit ? (
              <Image source={{ uri: resoudreUrlImage(item.imageUrlProduit) }} style={styles.image} />
            ) : (
              <IconePlaceholder style={styles.image} />
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.nomProduit} numberOfLines={1}>{item.nomProduit}</Text>
              <Text style={styles.quantiteTexte}>Quantite : {item.quantite}</Text>
              <Text style={styles.prixLigne}>{item.prixFcfaProduit * item.quantite} FCFA</Text>
            </View>
            <Pressable onPress={() => retirer(item.id)} style={styles.boutonRetirer}>
              <Trash2 color="#F87171" size={18} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.vide}>Votre panier est vide.</Text>}
      />
      {items.length > 0 && (
        <View style={styles.pied}>
          <View style={styles.ligneTotal}>
            <Text style={styles.libelleTotal}>Total</Text>
            <Text style={styles.valeurTotal}>{total} FCFA</Text>
          </View>
          <PrimaryButton titre="Passer commande" couleur={COLORS.boutique} onPress={valider} chargement={validation} />
        </View>
      )}
    <BottomTabBar navigation={navigation} variante="boutique" ongletActif="panier" />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10 },
  message: { color: COLORS.boutique, paddingHorizontal: 16, marginTop: 8 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  ligne: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 10, marginBottom: 10 },
  image: { width: 56, height: 56, borderRadius: 8 },
  nomProduit: { color: '#fff', fontWeight: '700', fontSize: 14 },
  quantiteTexte: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 2 },
  prixLigne: { color: COLORS.boutique, fontWeight: '700', fontSize: 13, marginTop: 4 },
  boutonRetirer: { padding: 6 },
  pied: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.bordure },
  ligneTotal: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  libelleTotal: { color: COLORS.texteAtténué, fontSize: 14 },
  valeurTotal: { color: '#fff', fontWeight: '800', fontSize: 18 },
});
