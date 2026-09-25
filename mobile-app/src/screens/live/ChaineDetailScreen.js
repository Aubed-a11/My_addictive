import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, Check } from 'lucide-react-native';
import client from '../../api/client';
import MessageErreur from '../../components/MessageErreur';
import TextField from '../../components/TextField';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';
import EnteteLogo from '../../components/EnteteLogo';
import { TELEPHONE_TEST_SANDBOX } from '../../utils/paiementKkiapay';

const MOYENS_PAIEMENT = [
  { cle: 'MTN_MOMO', label: 'MTN Mobile Money' },
  { cle: 'MOOV_MONEY', label: 'Moov Money' },
  { cle: 'CELTIIS_CASH', label: 'Celtiis Cash' },
  { cle: 'CARTE_BANCAIRE', label: 'Carte bancaire' },
  { cle: 'AGENCE', label: 'Paiement en agence' },
];
const MOBILE_MONEY = ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH'];

/**
 * Page de chaine (section 6.3) : regroupe tous les evenements passes, en
 * cours et a venir de l'organisateur/artiste, avec possibilite de
 * s'abonner (notifications, avec vrai toggle abonne/desabonne - pas
 * seulement un bouton qui ne fait qu'ajouter) et de rejoindre le fan club
 * payant (section 9.2 : acces anticipe, contenu exclusif), avec un vrai
 * choix du moyen de paiement.
 */
export default function ChaineDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { estConnecte } = useAuth();
  const [chaine, setChaine] = useState(null);
  const [evenements, setEvenements] = useState([]);
  const [statutFanClub, setStatutFanClub] = useState(null);
  const [estAbonne, setEstAbonne] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [chargementFanClub, setChargementFanClub] = useState(false);
  const [chargementAbonnement, setChargementAbonnement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [choixPaiementOuvert, setChoixPaiementOuvert] = useState(false);
  const [moyenPaiement, setMoyenPaiement] = useState('MTN_MOMO');
  const [telephonePayeur, setTelephonePayeur] = useState(TELEPHONE_TEST_SANDBOX);
  const [message, setMessage] = useState(null);

  const chargerFanClub = async () => {
    if (!estConnecte) return;
    try {
      const { data } = await client.get(`/api/live/chaines/${id}/fan-club/statut`);
      setStatutFanClub(data);
    } catch {}
  };

  const chargerAbonnement = async () => {
    if (!estConnecte) return;
    try {
      const { data } = await client.get('/api/live/mes-chaines-suivies');
      setEstAbonne(data.some((c) => c.id === id));
    } catch {}
  };

  useEffect(() => {
    (async () => {
      const { data: c } = await client.get(`/api/live/chaines/${id}`);
      setChaine(c);
      try {
        const { data: ev } = await client.get('/api/live/evenements', { params: { page: 0, size: 30 } });
        setEvenements((ev.content || []).filter((e) => e.chaineId === id));
      } finally {
        setChargement(false);
      }
      chargerFanClub();
      chargerAbonnement();
    })();
  }, [id]);

  const basculerAbonnement = async () => {
    if (!estConnecte) { navigation.navigate('Connexion', { returnTo: 'ChaineDetail', returnToParams: { id } }); return; }
    setChargementAbonnement(true);
    try {
      if (estAbonne) {
        await client.delete(`/api/live/abonnements-chaine/${id}`);
        setEstAbonne(false);
      } else {
        await client.post(`/api/live/abonnements-chaine/${id}`);
        setEstAbonne(true);
      }
      const { data } = await client.get(`/api/live/chaines/${id}`);
      setChaine(data);
    } finally {
      setChargementAbonnement(false);
    }
  };

  const rejoindreFanClub = async () => {
    if (!estConnecte) { navigation.navigate('Connexion', { returnTo: 'ChaineDetail', returnToParams: { id } }); return; }
    if (MOBILE_MONEY.includes(moyenPaiement) && telephonePayeur.trim().length < 8) {
      setErreur('Merci de renseigner un numéro de téléphone Mobile Money valide.');
      return;
    }
    setErreur(null);
    setChargementFanClub(true);
    try {
      const { data: transaction } = await client.post(`/api/live/chaines/${id}/fan-club/initier`, {
        moyenPaiement,
        telephonePayeur: MOBILE_MONEY.includes(moyenPaiement) ? telephonePayeur.trim() : undefined,
      });
      if (transaction.statut === 'REUSSI') {
        setMessage('Paiement confirme : bienvenue dans le fan club !');
        await chargerFanClub();
        setChoixPaiementOuvert(false);
      } else if (moyenPaiement === 'AGENCE') {
        setMessage("Demande enregistree. Ton accès fan club s'activera une fois le paiement vérifié en agence.");
        setChoixPaiementOuvert(false);
      } else if (MOBILE_MONEY.includes(moyenPaiement)) {
        setMessage('Demande envoyée sur ton téléphone. Valide avec ton code PIN pour activer ton accès.');
        setChoixPaiementOuvert(false);
      } else {
        setMessage('Paiement en cours de vérification.');
        setChoixPaiementOuvert(false);
      }
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargementFanClub(false);
    }
  };

  if (!chaine) return <ActivityIndicator color={COLORS.billetterie} style={{ marginTop: 40 }} />;

  const estFan = statutFanClub?.actif;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <EnteteLogo />
      <View style={{ padding: 20, paddingBottom: 10 }}>
        <View style={styles.entete}>
          <Text style={styles.nom}>{chaine.nom}</Text>
          {estFan && (
            <View style={styles.badgeFan}>
              <Star color="#0A0A0F" size={12} fill="#0A0A0F" />
              <Text style={styles.badgeFanTexte}>Fan club</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>{chaine.nombreAbonnes} abonnes</Text>
        {chaine.description && <Text style={styles.description}>{chaine.description}</Text>}

        <Pressable
          style={[styles.boutonAbonnement, estAbonne && styles.boutonAbonnementActif]}
          onPress={basculerAbonnement}
          disabled={chargementAbonnement}
        >
          {estAbonne && <Check color={COLORS.billetterie} size={16} />}
          <Text style={[styles.boutonTexte, estAbonne && { color: COLORS.billetterie }]}>
            {chargementAbonnement ? '...' : estAbonne ? 'Abonne' : "S'abonner a cette chaine"}
          </Text>
        </Pressable>

        <MessageErreur message={erreur} />
        {message && <Text style={styles.messageTexte}>{message}</Text>}

        {estFan ? (
          <View style={styles.carteFanActif}>
            <Text style={styles.carteFanTitre}>Vous etes membre du fan club</Text>
            <Text style={styles.carteFanMeta}>
              Actif jusqu'au {new Date(statutFanClub.dateExpiration).toLocaleDateString('fr-FR')} · acces anticipe et contenu exclusif
            </Text>
          </View>
        ) : !choixPaiementOuvert ? (
          <Pressable style={styles.boutonFanClub} onPress={() => setChoixPaiementOuvert(true)}>
            <Star color="#0A0A0F" size={16} />
            <Text style={styles.boutonFanClubTexte}>Rejoindre le fan club — 2000 FCFA / mois</Text>
          </Pressable>
        ) : (
          <View style={styles.blocChoixPaiement}>
            <Text style={styles.libelleMoyenPaiement}>Moyen de paiement</Text>
            <View style={styles.moyensPaiement}>
              {MOYENS_PAIEMENT.map((m) => (
                <Pressable
                  key={m.cle}
                  style={[styles.moyenPaiement, moyenPaiement === m.cle && { borderColor: COLORS.or, backgroundColor: 'rgba(255,204,33,0.12)' }]}
                  onPress={() => setMoyenPaiement(m.cle)}
                >
                  <Text style={[styles.moyenPaiementTexte, moyenPaiement === m.cle && { color: COLORS.or }]}>{m.label}</Text>
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
            <Pressable style={styles.boutonFanClub} onPress={rejoindreFanClub} disabled={chargementFanClub}>
              <Star color="#0A0A0F" size={16} />
              <Text style={styles.boutonFanClubTexte}>{chargementFanClub ? 'Traitement...' : 'Confirmer — 2000 FCFA / mois'}</Text>
            </Pressable>
            <Pressable onPress={() => setChoixPaiementOuvert(false)} style={{ marginTop: 10 }}>
              <Text style={styles.lienAnnuler}>Annuler</Text>
            </Pressable>
          </View>
        )}
        <Text style={styles.notePetit}>Acces anticipe aux billets et contenu exclusif de cette chaine.</Text>

        <Text style={styles.sectionTitre}>Evenements de la chaine</Text>
      </View>

      {chargement && <ActivityIndicator color={COLORS.billetterie} />}

      <FlatList
                style={{ flex: 1 }}
        data={evenements}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.carte} onPress={() => navigation.navigate('EvenementDetail', { id: item.id })}>
            <Text style={styles.carteTitre}>{item.titre}</Text>
            <Text style={styles.carteMeta}>{item.lieu} · {item.statut}</Text>
          </Pressable>
        )}
        ListEmptyComponent={!chargement && <Text style={styles.vide}>Aucun evenement pour cette chaine.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="live" />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nom: { color: '#fff', fontSize: 22, fontWeight: '800' },
  badgeFan: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.or, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeFanTexte: { color: '#0A0A0F', fontWeight: '800', fontSize: 10 },
  meta: { color: COLORS.texteAtténué, fontSize: 13, marginTop: 4 },
  description: { color: COLORS.texteAtténué, fontSize: 13, marginTop: 10, lineHeight: 19 },
  boutonAbonnement: { flexDirection: 'row', gap: 6, backgroundColor: COLORS.billetterie, borderRadius: 24, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  boutonAbonnementActif: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: COLORS.billetterie },
  boutonTexte: { color: '#fff', fontWeight: '700', fontSize: 13 },
  messageTexte: { color: COLORS.musique, fontSize: 12, marginTop: 8, textAlign: 'center' },
  boutonFanClub: { flexDirection: 'row', gap: 8, backgroundColor: COLORS.or, borderRadius: 24, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  boutonFanClubTexte: { color: '#0A0A0F', fontWeight: '800', fontSize: 13 },
  carteFanActif: { backgroundColor: 'rgba(255,204,33,0.1)', borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 1, borderColor: COLORS.or },
  carteFanTitre: { color: COLORS.or, fontWeight: '700', fontSize: 13 },
  carteFanMeta: { color: COLORS.texteAtténué, fontSize: 11, marginTop: 4 },
  blocChoixPaiement: { marginTop: 12, backgroundColor: COLORS.fondCarte, borderRadius: 14, padding: 14 },
  libelleMoyenPaiement: { color: '#fff', fontWeight: '600', fontSize: 13, marginBottom: 8 },
  moyensPaiement: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  moyenPaiement: { paddingVertical: 7, paddingHorizontal: 11, borderRadius: 18, borderWidth: 1, borderColor: COLORS.bordure },
  moyenPaiementTexte: { color: COLORS.texteAtténué, fontSize: 11, fontWeight: '600' },
  lienAnnuler: { color: COLORS.texteAtténué, fontSize: 12, textAlign: 'center' },
  notePetit: { color: COLORS.texteAtténué, fontSize: 11, marginTop: 8, textAlign: 'center' },
  sectionTitre: { color: '#fff', fontWeight: '700', fontSize: 15, marginTop: 24 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 30 },
  carte: { backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 14, marginBottom: 10 },
  carteTitre: { color: '#fff', fontWeight: '700' },
  carteMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
});
