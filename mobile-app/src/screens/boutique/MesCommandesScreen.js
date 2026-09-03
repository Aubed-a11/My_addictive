import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, FlatList, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

const LIBELLES_STATUT_LIVRAISON = { EN_PREPARATION: 'En preparation', EXPEDIE: 'Expedie', LIVRE: 'Livre' };

/** Historique des commandes, avec detail des articles par ligne (panier multi-vendeurs, section 8.1). */
export default function MesCommandesScreen({ navigation }) {
  const [commandes, setCommandes] = useState([]);
  const [commandeOuverte, setCommandeOuverte] = useState(null);
  const [lignesParCommande, setLignesParCommande] = useState({});

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/boutique/commandes');
      setCommandes(data);
    })();
  }, []);

  const basculer = async (commandeId) => {
    if (commandeOuverte === commandeId) { setCommandeOuverte(null); return; }
    if (!lignesParCommande[commandeId]) {
      const { data } = await client.get(`/api/boutique/commandes/${commandeId}/lignes`);
      setLignesParCommande((prev) => ({ ...prev, [commandeId]: data }));
    }
    setCommandeOuverte(commandeId);
  };

  return (
    <LinearGradient colors={['#2A1A05', '#150C02', COLORS.fond]} style={styles.safe}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Text style={styles.titre}>Mes commandes</Text>
      <FlatList
                style={{ flex: 1 }}
        data={commandes}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.carte} onPress={() => basculer(item.id)}>
            <View style={styles.enteteCarte}>
              <View>
                <Text style={styles.carteTitre}>Commande #{item.id}</Text>
                <Text style={styles.carteMeta}>{item.montantTotalFcfa} FCFA  ·  {item.statut}  ·  {new Date(item.dateCommande).toLocaleDateString('fr-FR')}</Text>
              </View>
              {commandeOuverte === item.id ? <ChevronUp color={COLORS.texteAtténué} size={18} /> : <ChevronDown color={COLORS.texteAtténué} size={18} />}
            </View>

            {commandeOuverte === item.id && (
              <View style={styles.lignes}>
                {(lignesParCommande[item.id] || []).map((ligne) => (
                  <View key={ligne.id} style={styles.ligne}>
                    <Text style={styles.ligneNom}>{ligne.nomProduit} × {ligne.quantite}</Text>
                    <Text style={styles.lignePrix}>{ligne.prixUnitaireFcfa * ligne.quantite} FCFA</Text>
                    <Text style={styles.ligneStatut}>{LIBELLES_STATUT_LIVRAISON[ligne.statutLivraison] || ligne.statutLivraison}</Text>
                  </View>
                ))}
                {(lignesParCommande[item.id] || []).length === 0 && (
                  <Text style={styles.videLignes}>Chargement des articles...</Text>
                )}
              </View>
            )}
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.vide}>Aucune commande pour le moment.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="boutique" />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  carte: { backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 14, marginBottom: 10 },
  enteteCarte: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  carteTitre: { color: '#fff', fontWeight: '700' },
  carteMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
  lignes: { marginTop: 12, borderTopWidth: 1, borderTopColor: COLORS.bordure, paddingTop: 10 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  ligneNom: { color: '#fff', fontSize: 13, flex: 1 },
  lignePrix: { color: COLORS.boutique, fontSize: 12, fontWeight: '700', marginHorizontal: 8 },
  ligneStatut: { color: COLORS.texteAtténué, fontSize: 11 },
  videLignes: { color: COLORS.texteAtténué, fontSize: 12 },
});
