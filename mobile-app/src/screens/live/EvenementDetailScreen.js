import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Image, ImageBackground, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Heart } from 'lucide-react-native';
import client from '../../api/client';
import PrimaryButton from '../../components/PrimaryButton';
import TextField from '../../components/TextField';
import MessageErreur from '../../components/MessageErreur';
import SondageEnDirect from '../../components/SondageEnDirect';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import EnteteLogo from '../../components/EnteteLogo';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

const LIBELLES_STATUT = { A_VENIR: 'A venir', EN_DIRECT: 'En direct', TERMINE: 'Termine', REPLAY: 'Replay' };

const MOYENS_PAIEMENT = [
  { cle: 'MTN_MOMO', label: 'MTN Mobile Money' },
  { cle: 'MOOV_MONEY', label: 'Moov Money' },
  { cle: 'CELTIIS_CASH', label: 'Celtiis Cash' },
  { cle: 'CARTE_BANCAIRE', label: 'Carte bancaire' },
  { cle: 'AGENCE', label: 'Paiement en agence' },
];

/**
 * Achat de billet en deux etapes maximum (section 6.2), avec compteur de
 * spectateurs si l'evenement est en cours. Le chat en direct (section 6.5)
 * s'ouvre desormais dans son propre ecran plein ecran (voir ChatLiveScreen),
 * fidele a la maquette de reference, plutot que d'etre integre ici.
 */
export default function EvenementDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { estConnecte } = useAuth();
  const [evenement, setEvenement] = useState(null);
  const [spectateurs, setSpectateurs] = useState(0);
  const [categorie, setCategorie] = useState('STANDARD');
  const [moyenPaiement, setMoyenPaiement] = useState('MTN_MOMO');
  const [telephonePayeur, setTelephonePayeur] = useState('');
  const [achatEnCours, setAchatEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [favori, setFavori] = useState(false);
  const [favoriId, setFavoriId] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await client.get(`/api/live/evenements/${id}`);
      setEvenement(data);
    })();
  }, [id]);

  useEffect(() => {
    if (!estConnecte) return;
    (async () => {
      try {
        const { data: favoris } = await client.get('/api/compte/favoris');
        const existant = (favoris || []).find((f) => f.typeCible === 'EVENEMENT' && f.referenceId === String(id));
        if (existant) { setFavori(true); setFavoriId(existant.id); }
      } catch {}
    })();
  }, [id, estConnecte]);

  const basculerFavori = async () => {
    if (!estConnecte) { navigation.navigate('Connexion', { returnTo: 'EvenementDetail', returnToParams: { id } }); return; }
    if (favori && favoriId) {
      setFavori(false);
      try { await client.delete(`/api/compte/favoris/${favoriId}`); } catch { setFavori(true); }
    } else {
      setFavori(true);
      try {
        const { data } = await client.post('/api/compte/favoris', { typeCible: 'EVENEMENT', referenceId: String(id) });
        setFavoriId(data.id);
      } catch { setFavori(false); }
    }
  };

  useEffect(() => {
    if (!evenement || evenement.statut !== 'EN_DIRECT') return;
    let actif = true;
    const rafraichir = async () => {
      try {
        const { data: nb } = await client.get(`/api/live/evenements/${id}/spectateurs`);
        if (actif) setSpectateurs(nb);
      } catch {}
    };
    rafraichir();
    const intervalle = setInterval(rafraichir, 4000);
    return () => { actif = false; clearInterval(intervalle); };
  }, [evenement, id]);

  const MOBILE_MONEY = ['MTN_MOMO', 'MOOV_MONEY', 'CELTIIS_CASH'];

  const acheterBillet = async () => {
    if (!estConnecte) {
      navigation.navigate('Connexion', { returnTo: 'EvenementDetail', returnToParams: { id } });
      return;
    }
    if (MOBILE_MONEY.includes(moyenPaiement) && telephonePayeur.trim().length < 8) {
      setErreur('Merci de renseigner un numero de telephone Mobile Money valide.');
      return;
    }
    setErreur(null);
    setAchatEnCours(true);
    try {
      const { data: transaction } = await client.post('/api/live/billets/initier-achat', {
        evenementId: id, categorie, moyenPaiement,
        telephonePayeur: MOBILE_MONEY.includes(moyenPaiement) ? telephonePayeur.trim() : undefined,
      });
      // Le paiement en agence ne peut jamais etre confirme automatiquement (voir
      // paiement-service) : le billet n'existe donc pas encore a ce stade, tant
      // qu'un administrateur n'a pas verifie manuellement la reception des especes.
      if (transaction.statut === 'REUSSI') {
        setMessage('Paiement confirme : retrouvez votre billet (QR code) dans "Mes billets".');
      } else if (moyenPaiement === 'AGENCE') {
        setMessage("Demande enregistree. Presentez-vous a l'agence pour regler le montant : votre billet sera disponible dans \"Mes billets\" une fois le paiement verifie par un agent.");
      } else if (MOBILE_MONEY.includes(moyenPaiement)) {
        setMessage('Une demande de paiement a ete envoyee sur votre telephone. Validez-la avec votre code PIN Mobile Money : votre billet apparaitra automatiquement dans "Mes billets" des confirmation.');
      } else {
        setMessage('Paiement en cours de verification. Votre billet apparaitra dans "Mes billets" des sa confirmation.');
      }
    } catch (e) {
      setErreur(e.message);
    } finally {
      setAchatEnCours(false);
    }
  };

  if (!evenement) return <ActivityIndicator color={COLORS.billetterie} style={{ marginTop: 40 }} />;

  return (
    <ImageBackground source={require('../../../assets/images/scene_connexion.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <ScrollView contentContainerStyle={{ paddingBottom: HAUTEUR_BARRE_ONGLETS + 20 }}>
      <View>
        {evenement.imageUrl ? (
          <Image source={{ uri: resoudreUrlImage(evenement.imageUrl) }} style={styles.image} />
        ) : (
          <IconePlaceholder style={styles.image} />
        )}
        <Pressable style={styles.boutonCoeur} onPress={basculerFavori}>
          <Heart size={18} color={favori ? COLORS.billetterie : '#fff'} fill={favori ? COLORS.billetterie : 'none'} />
        </Pressable>
      </View>
      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={styles.titre}>{evenement.titre}</Text>
        <Text style={styles.lieu}>{evenement.lieu}</Text>
        <Text style={[styles.statut, { color: evenement.statut === 'EN_DIRECT' ? '#EF4444' : COLORS.texteAtténué }]}>
          {LIBELLES_STATUT[evenement.statut] || evenement.statut}{evenement.statut === 'EN_DIRECT' ? `  ·  ${spectateurs} spectateurs` : ''}
        </Text>

        {evenement.statut === 'EN_DIRECT' && (
          <View style={styles.lecteur}>
            <Text style={styles.lecteurTexte}>Lecteur video en direct (a integrer : ex. react-native-video pointant vers evenement.urlFlux)</Text>
          </View>
        )}
        {evenement.statut === 'REPLAY' && (
          <View style={styles.lecteur}>
            <Text style={styles.lecteurTexte}>Replay disponible (a integrer : evenement.urlReplay)</Text>
          </View>
        )}

        <MessageErreur message={erreur} />
        {message && <Text style={styles.message}>{message}</Text>}

        {evenement.statut === 'EN_DIRECT' && (
          <Pressable
            style={styles.boutonChat}
            onPress={() => navigation.navigate('ChatLive', { id, titre: evenement.titre })}
          >
            <MessageCircle color={COLORS.live} size={18} />
            <Text style={styles.boutonChatTexte}>Ouvrir le chat en direct</Text>
          </Pressable>
        )}

        {evenement.payant && evenement.statut !== 'TERMINE' && (
          <>
            <View style={styles.categories}>
              {['STANDARD', 'VIP'].map((c) => (
                <PrimaryButton
                  key={c}
                  titre={c === 'STANDARD' ? `Standard  ·  ${evenement.prixStandardFcfa} FCFA` : `VIP  ·  ${evenement.prixVipFcfa} FCFA`}
                  couleur={categorie === c ? COLORS.billetterie : COLORS.fondCarte}
                  onPress={() => setCategorie(c)}
                />
              ))}
            </View>

            <Text style={styles.libelleMoyenPaiement}>Moyen de paiement</Text>
            <View style={styles.moyensPaiement}>
              {MOYENS_PAIEMENT.map((m) => (
                <Pressable
                  key={m.cle}
                  style={[styles.moyenPaiement, moyenPaiement === m.cle && { borderColor: COLORS.billetterie, backgroundColor: 'rgba(249,115,22,0.12)' }]}
                  onPress={() => setMoyenPaiement(m.cle)}
                >
                  <Text style={[styles.moyenPaiementTexte, moyenPaiement === m.cle && { color: COLORS.billetterie }]}>{m.label}</Text>
                </Pressable>
              ))}
            </View>
            {MOBILE_MONEY.includes(moyenPaiement) && (
              <TextField
                placeholder="Numero Mobile Money (ex. 90000000)"
                value={telephonePayeur}
                onChangeText={setTelephonePayeur}
                keyboardType="phone-pad"
                style={{ marginBottom: 6 }}
              />
            )}
            {moyenPaiement === 'AGENCE' && (
              <Text style={styles.avertissementAgence}>
                Le billet ne sera disponible qu'apres verification de votre paiement en agence par un agent.
              </Text>
            )}

            <PrimaryButton titre="Reserver maintenant" onPress={acheterBillet} couleur={COLORS.billetterie} chargement={achatEnCours} />
          </>
        )}
      </View>

      {evenement.statut === 'EN_DIRECT' && <SondageEnDirect navigation={navigation} evenementId={id} />}
      </ScrollView>
      <BottomTabBar navigation={navigation} variante="live" ongletActif="live" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.65)' },
  image: { width: '100%', aspectRatio: 16 / 9 },
  boutonCoeur: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  titre: { color: '#fff', fontSize: 24, fontWeight: '800' },
  lieu: { color: COLORS.texteAtténué, fontSize: 14, marginTop: 4 },
  statut: { fontSize: 13, fontWeight: '700', marginTop: 10, marginBottom: 16 },
  lecteur: { backgroundColor: COLORS.fondCarte, borderRadius: 14, padding: 20, marginBottom: 16, alignItems: 'center' },
  lecteurTexte: { color: COLORS.texteAtténué, fontSize: 12, textAlign: 'center' },
  message: { color: COLORS.billetterie, marginBottom: 10 },
  boutonChat: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.live },
  boutonChatTexte: { color: '#fff', fontWeight: '600', fontSize: 13 },
  categories: { marginBottom: 4 },
  libelleMoyenPaiement: { color: '#fff', fontWeight: '600', fontSize: 13, marginTop: 14, marginBottom: 8 },
  moyensPaiement: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  moyenPaiement: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: COLORS.bordure, backgroundColor: COLORS.fondCarte },
  moyenPaiementTexte: { color: COLORS.texteAtténué, fontSize: 12, fontWeight: '600' },
  avertissementAgence: { color: COLORS.or, fontSize: 11, marginBottom: 14, lineHeight: 16 },
});
