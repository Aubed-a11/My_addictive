import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import client from '../../api/client';
import PrimaryButton from '../../components/PrimaryButton';
import MessageErreur from '../../components/MessageErreur';
import { COLORS } from '../../theme/colors';
import { TAUX_PIECE_FCFA } from '../../theme/votes';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

// Tarif de base aligne sur le taux affiche (1 piece = 100 FCFA), avec un petit bonus sur les gros packs.
const PACKS = [
  { pieces: 10, prix: 10 * TAUX_PIECE_FCFA },
  { pieces: 55, prix: 50 * TAUX_PIECE_FCFA, bonus: '10% de pieces offertes' },
  { pieces: 140, prix: 120 * TAUX_PIECE_FCFA, bonus: '15% de pieces offertes' },
];

/** "Mon Wallet" (section 9.1) : solde, recharge, historique des mouvements. */
export default function PortefeuilleScreen({ navigation }) {
  const [solde, setSolde] = useState(0);
  const [mouvements, setMouvements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [chargementPack, setChargementPack] = useState(null);

  const rafraichir = async () => {
    const [{ data: p }, { data: m }] = await Promise.all([
      client.get('/api/votes/portefeuille'),
      client.get('/api/votes/portefeuille/mouvements'),
    ]);
    setSolde(p.solde);
    setMouvements(m);
    setChargement(false);
  };

  useEffect(() => { rafraichir(); }, []);

  const acheter = async (pack) => {
    setErreur(null);
    setChargementPack(pack.pieces);
    try {
      await client.post('/api/votes/portefeuille/acheter-pieces', {
        nombrePieces: pack.pieces, montantFcfa: pack.prix, moyenPaiement: 'MTN_MOMO',
      });
      setMessage(`${pack.pieces} pieces creditees.`);
      setModalOuvert(false);
      await rafraichir();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargementPack(null);
    }
  };

  const formaterDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <ImageBackground source={require('../../../assets/images/scene_hub.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Text style={styles.titre}>Mon Wallet</Text>

      <View style={styles.carteSolde}>
        <Wallet color={COLORS.or} size={22} />
        <Text style={styles.libelleSolde}>Solde actuel</Text>
        <Text style={styles.solde}>{solde} <Text style={styles.soldeUnite}>pieces</Text></Text>
        <Text style={styles.tauxConversion}>1 piece = {TAUX_PIECE_FCFA} FCFA</Text>
        <PrimaryButton titre="Recharger" onPress={() => setModalOuvert(true)} couleur={COLORS.or} />
      </View>

      {message && <Text style={styles.message}>{message}</Text>}

      <Text style={styles.sousTitre}>Historique</Text>
      <FlatList
                style={{ flex: 1 }}
        data={mouvements}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        renderItem={({ item }) => {
          const positif = item.montant > 0;
          return (
            <View style={styles.ligneMouvement}>
              <View style={[styles.iconeMouvement, { backgroundColor: positif ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                {positif ? <ArrowUpRight color="#22C55E" size={16} /> : <ArrowDownRight color="#EF4444" size={16} />}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.motif}>{item.motif}</Text>
                <Text style={styles.date}>{formaterDate(item.dateMouvement)}</Text>
              </View>
              <Text style={[styles.montant, { color: positif ? '#22C55E' : '#EF4444' }]}>
                {positif ? '+' : ''}{item.montant}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={!chargement && <Text style={styles.vide}>Aucun mouvement pour le moment.</Text>}
      />

      <Modal visible={modalOuvert} transparent animationType="slide" onRequestClose={() => setModalOuvert(false)}>
        <Pressable style={styles.fondModal} onPress={() => setModalOuvert(false)}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitre}>Acheter des pieces</Text>
            <Text style={styles.modalSousTitre}>Non remboursables une fois utilisees pour voter.</Text>
            <MessageErreur message={erreur} />
            {PACKS.map((p) => (
              <View key={p.pieces}>
                <PrimaryButton
                  titre={`${p.pieces} pieces  ·  ${p.prix} FCFA`}
                  couleur={COLORS.or}
                  onPress={() => acheter(p)}
                  chargement={chargementPack === p.pieces}
                />
                {p.bonus && <Text style={styles.bonus}>{p.bonus}</Text>}
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    <BottomTabBar navigation={navigation} variante="compte" ongletActif="wallet" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 20, paddingTop: 10 },
  carteSolde: { backgroundColor: COLORS.fondCarte, borderRadius: 18, padding: 22, marginHorizontal: 20, marginTop: 16, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.bordure },
  libelleSolde: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 8 },
  solde: { color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 4 },
  soldeUnite: { fontSize: 16, fontWeight: '600', color: COLORS.texteAtténué },
  tauxConversion: { color: COLORS.or, fontSize: 12, fontWeight: '600', marginTop: 4, marginBottom: 16 },
  message: { color: COLORS.compte, textAlign: 'center', marginBottom: 10 },
  sousTitre: { color: '#fff', fontWeight: '700', fontSize: 14, paddingHorizontal: 20, marginBottom: 4 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 30 },
  ligneMouvement: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 12, marginBottom: 8 },
  iconeMouvement: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  motif: { color: '#fff', fontSize: 13, fontWeight: '600' },
  date: { color: COLORS.texteAtténué, fontSize: 11, marginTop: 2 },
  montant: { fontWeight: '800', fontSize: 14 },
  fondModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.fondCarte, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitre: { color: '#fff', fontSize: 18, fontWeight: '800' },
  modalSousTitre: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4, marginBottom: 16 },
  bonus: { color: COLORS.or, fontSize: 11, textAlign: 'center', marginTop: -6, marginBottom: 10 },
});
