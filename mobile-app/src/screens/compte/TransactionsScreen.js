import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import MessageErreur from '../../components/MessageErreur';
import { COLORS } from '../../theme/colors';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/** Historique des transactions et verification d'un identifiant (section 9.1, socle paiement section 10). */
export default function TransactionsScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [idRecherche, setIdRecherche] = useState('');
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/paiement/transactions');
      setTransactions(data);
    })();
  }, []);

  const verifier = async () => {
    setErreur(null);
    setResultat(null);
    setChargement(true);
    try {
      const { data } = await client.get(`/api/paiement/transactions/${idRecherche}`);
      setResultat(data);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <ImageBackground source={require('../../../assets/images/scene_hub.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={{ padding: 16 }}>
        <Text style={styles.titre}>Verifier une transaction</Text>
        <View style={styles.ligneVerif}>
          <View style={{ flex: 1 }}>
            <TextField placeholder="Numero de transaction" value={idRecherche} onChangeText={setIdRecherche} keyboardType="number-pad" />
          </View>
        </View>
        <PrimaryButton titre="Verifier" onPress={verifier} couleur={COLORS.compte} chargement={chargement} />
        <MessageErreur message={erreur} />
        {resultat && (
          <View style={styles.carteResultat}>
            <Text style={styles.resultatLigne}>Statut : <Text style={styles.resultatValeur}>{resultat.statut}</Text></Text>
            <Text style={styles.resultatLigne}>Montant : <Text style={styles.resultatValeur}>{resultat.montantFcfa} FCFA</Text></Text>
            <Text style={styles.resultatLigne}>Moyen : <Text style={styles.resultatValeur}>{resultat.moyenPaiement}</Text></Text>
          </View>
        )}
      </View>

      <Text style={styles.titre}>Mes transactions</Text>
      <FlatList
                style={{ flex: 1 }}
        data={transactions}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        renderItem={({ item }) => (
          <View style={styles.ligne}>
            <View>
              <Text style={styles.ligneTitre}>#{item.id} · {item.typeObjet}</Text>
              <Text style={styles.ligneMeta}>{new Date(item.dateCreation).toLocaleString('fr-FR')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.montant}>{item.montantFcfa} FCFA</Text>
              <Text style={[styles.statut, item.statut === 'REUSSI' ? { color: COLORS.musique } : item.statut === 'ECHEC' ? { color: '#F87171' } : { color: COLORS.or }]}>
                {item.statut}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.vide}>Aucune transaction pour le moment.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="compte" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 10, marginBottom: 10, paddingHorizontal: 16 },
  ligneVerif: { flexDirection: 'row', paddingHorizontal: 16 },
  carteResultat: { backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 16, marginHorizontal: 16, marginTop: 10 },
  resultatLigne: { color: COLORS.texteAtténué, fontSize: 13, marginBottom: 4 },
  resultatValeur: { color: '#fff', fontWeight: '700' },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 20 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 14, marginBottom: 10 },
  ligneTitre: { color: '#fff', fontWeight: '600', fontSize: 13 },
  ligneMeta: { color: COLORS.texteAtténué, fontSize: 11, marginTop: 4 },
  montant: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statut: { fontSize: 11, fontWeight: '700', marginTop: 4 },
});
