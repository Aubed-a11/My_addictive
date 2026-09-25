import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, Minus, Plus } from 'lucide-react-native';
import client from '../../api/client';
import { payerAvecKkiapay } from '../../utils/paiementKkiapay';
import PrimaryButton from '../../components/PrimaryButton';
import TextField from '../../components/TextField';
import MessageErreur from '../../components/MessageErreur';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import { LinearGradient } from 'expo-linear-gradient';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';
import { TELEPHONE_TEST_SANDBOX } from '../../utils/paiementKkiapay';

const MOYENS_PAIEMENT = [
  { cle: 'KKIAPAY', label: 'Mobile Money / Carte (KKiaPay)' },
  { cle: 'MTN_MOMO', label: 'MTN Mobile Money' },
  { cle: 'MOOV_MONEY', label: 'Moov Money' },
  { cle: 'CELTIIS_CASH', label: 'Celtiis Cash' },
  { cle: 'CARTE_BANCAIRE', label: 'Carte bancaire' },
  { cle: 'AGENCE', label: 'Paiement en agence' },
];
const MOBILE_MONEY = ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH'];

/** Panier multi-vendeurs (section 8.1) : la repartition entre vendeurs se fait automatiquement cote serveur. */
export default function PanierScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [validation, setValidation] = useState(false);
  const [moyenPaiement, setMoyenPaiement] = useState('KKIAPAY');
  const [telephonePayeur, setTelephonePayeur] = useState(TELEPHONE_TEST_SANDBOX);

  const charger = useCallback(async () => {
    const { data } = await client.get('/api/boutique/panier');
    setItems(data);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const retirer = async (id) => {
    await client.delete(`/api/boutique/panier/${id}`);
    charger();
  };

  // Mise a jour optimiste (l'affichage change avant la reponse serveur) pour que les boutons +/- semblent instantanes.
  const modifierQuantite = async (item, delta) => {
    const nouvelleQuantite = item.quantite + delta;
    if (nouvelleQuantite < 1) { retirer(item.id); return; }
    setItems((precedent) => precedent.map((i) => (i.id === item.id ? { ...i, quantite: nouvelleQuantite } : i)));
    try {
      await client.put(`/api/boutique/panier/${item.id}`, { quantite: nouvelleQuantite });
    } catch {
      charger(); // en cas d'echec (ex. stock insuffisant), on resynchronise avec la vraie valeur serveur
    }
  };

  const valider = async () => {
    if (MOBILE_MONEY.includes(moyenPaiement) && telephonePayeur.trim().length < 8) {
      setErreur('Merci de renseigner un numéro de téléphone Mobile Money valide.');
      return;
    }
    setErreur(null);
    setValidation(true);
    try {
      const { data: transaction } = await client.post('/api/boutique/commandes/initier', {
        moyenPaiement,
        telephonePayeur: MOBILE_MONEY.includes(moyenPaiement) ? telephonePayeur.trim() : undefined,
      });

      if (moyenPaiement === 'KKIAPAY') {
        setMessage('Ouverture du paiement KKiaPay...');
        const finale = await payerAvecKkiapay({ transactionId: transaction.id, montantFcfa: total, motif: 'Commande My Addictive' });
        setMessage(finale.statut === 'REUSSI'
          ? 'Commande payee avec succès ! Retrouvez-la dans "Mes commandes".'
          : "Le paiement n'a pas abouti. Vous pouvez reessayer.");
        charger();
        setValidation(false);
        return;
      }

      if (transaction.statut === 'REUSSI') {
        setMessage('Commande payee avec succès ! Retrouvez-la dans "Mes commandes".');
      } else if (moyenPaiement === 'AGENCE') {
        setMessage("Demande enregistree. Presentez-vous a l'agence pour regler le montant : votre commande sera confirmée une fois le paiement vérifié par un agent.");
      } else if (MOBILE_MONEY.includes(moyenPaiement)) {
        setMessage('Une demande de paiement a été envoyée sur votre téléphone. Validez-la avec votre code PIN Mobile Money : votre commande sera confirmée des reception.');
      } else {
        setMessage('Paiement en cours de vérification. Votre commande sera confirmée des sa validation.');
      }
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
              <View style={styles.ligneQuantite}>
                <Pressable style={styles.boutonQuantite} onPress={() => modifierQuantite(item, -1)}>
                  <Minus size={14} color="#fff" />
                </Pressable>
                <Text style={styles.quantiteTexte}>{item.quantite}</Text>
                <Pressable style={styles.boutonQuantite} onPress={() => modifierQuantite(item, 1)}>
                  <Plus size={14} color="#fff" />
                </Pressable>
              </View>
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

          <Text style={styles.libelleMoyenPaiement}>Moyen de paiement</Text>
          <View style={styles.moyensPaiement}>
            {MOYENS_PAIEMENT.map((m) => (
              <Pressable
                key={m.cle}
                style={[styles.moyenPaiement, moyenPaiement === m.cle && { borderColor: COLORS.boutique, backgroundColor: 'rgba(217,119,6,0.15)' }]}
                onPress={() => setMoyenPaiement(m.cle)}
              >
                <Text style={[styles.moyenPaiementTexte, moyenPaiement === m.cle && { color: COLORS.boutique }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
          {MOBILE_MONEY.includes(moyenPaiement) && (
            <TextField
              placeholder="Numéro Mobile Money (ex. 90000000)"
              value={telephonePayeur}
              onChangeText={setTelephonePayeur}
              keyboardType="phone-pad"
              style={{ marginBottom: 10 }}
            />
          )}
          {moyenPaiement === 'AGENCE' && (
            <Text style={styles.avertissementAgence}>
              La commande ne sera confirmee qu'apres verification de votre paiement en agence par un agent.
            </Text>
          )}

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
  ligneQuantite: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  boutonQuantite: { width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  quantiteTexte: { color: '#fff', fontWeight: '700', fontSize: 13, minWidth: 16, textAlign: 'center' },
  prixLigne: { color: COLORS.boutique, fontWeight: '700', fontSize: 13, marginTop: 4 },
  boutonRetirer: { padding: 6 },
  pied: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.bordure },
  ligneTotal: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  libelleTotal: { color: COLORS.texteAtténué, fontSize: 14 },
  valeurTotal: { color: '#fff', fontWeight: '800', fontSize: 18 },
  libelleMoyenPaiement: { color: '#fff', fontWeight: '600', fontSize: 13, marginBottom: 8 },
  moyensPaiement: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  moyenPaiement: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.bordure, backgroundColor: 'rgba(255,255,255,0.05)' },
  moyenPaiementTexte: { color: COLORS.texteAtténué, fontSize: 12, fontWeight: '600' },
  avertissementAgence: { color: COLORS.or, fontSize: 11, marginBottom: 10, lineHeight: 16 },
});
