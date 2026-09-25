import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { Share2, PlayCircle } from 'lucide-react-native';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import { partagerContenu } from '../../utils/partage';
import IconePlaceholder from '../../components/IconePlaceholder';
import EnteteLogo from '../../components/EnteteLogo';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';
import PrimaryButton from '../../components/PrimaryButton';
import MessageErreur from '../../components/MessageErreur';
import ConfettiVote from '../../components/ConfettiVote';

const LIBELLES_STATUT = { EN_LICE: 'En lice', ELIMINE: 'Elimine' };

/** Mini-profil public du candidat, avec extrait video reel (section 7.1 et 7.2) et vote possible directement depuis la fiche. */
export default function CandidatDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { estConnecte } = useAuth();
  const [candidat, setCandidat] = useState(null);
  const [entreeClassement, setEntreeClassement] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [voteEnCours, setVoteEnCours] = useState(false);
  const [confettis, setConfettis] = useState([]);
  const [solde, setSolde] = useState(null);
  const confettiIdRef = useRef(0);

  useEffect(() => {
    if (!estConnecte) { setSolde(null); return; }
    client.get('/api/votes/portefeuille').then(({ data }) => setSolde(data.solde)).catch(() => {});
  }, [estConnecte]);

  const charger = async () => {
    const { data } = await client.get(`/api/votes/candidats/${id}`);
    setCandidat(data);
    try {
      const { data: classement } = await client.get(`/api/votes/competitions/${data.competitionId}/classement`);
      setEntreeClassement(classement.find((c) => c.candidatId === id) || null);
    } catch {}
  };

  useEffect(() => { charger(); }, [id]);

  const voter = async (evenement) => {
    if (!estConnecte) {
      navigation.navigate('Connexion', { returnTo: 'CandidatDetail', returnToParams: route.params });
      return;
    }
    setErreur(null);
    setVoteEnCours(true);
    try {
      await client.post('/api/votes/voter', { candidatId: id });
      if (evenement?.nativeEvent) {
        const { pageX, pageY } = evenement.nativeEvent;
        const confettiId = confettiIdRef.current++;
        setConfettis((precedent) => [...precedent, { confettiId, x: pageX, y: pageY }]);
      }
      await charger();
      client.get('/api/votes/portefeuille').then(({ data }) => setSolde(data.solde)).catch(() => {});
    } catch (e) {
      setErreur(e.message);
    } finally {
      setVoteEnCours(false);
    }
  };

  const retirerConfetti = (confettiId) => {
    setConfettis((precedent) => precedent.filter((c) => c.confettiId !== confettiId));
  };

  const partager = async () => {
    try {
      await partagerContenu({ titre: candidat.nom, message: `Vote pour ${candidat.nom} sur My Addictive !` });
    } catch {}
  };

  if (!candidat) return <ActivityIndicator color={COLORS.votes} style={{ marginTop: 40 }} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <EnteteLogo />
      <View style={{ padding: 20 }}>
        <View style={styles.ligneEntete}>
          {candidat.photoUrl ? (
            <Image source={{ uri: resoudreUrlImage(candidat.photoUrl) }} style={styles.photo} />
          ) : (
            <IconePlaceholder style={styles.photo} />
          )}
          <Pressable style={styles.boutonPartage} onPress={partager}>
            <Share2 size={18} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.nom}>{candidat.nom}</Text>
        <Text style={styles.ville}>{candidat.ville}</Text>
        <Text style={[styles.statut, candidat.statut === 'ELIMINE' && { color: '#F87171' }]}>
          {LIBELLES_STATUT[candidat.statut] || candidat.statut}
        </Text>

        <View style={styles.ligneCartes}>
          <View style={styles.carteNote}>
            <Text style={styles.noteLabel}>Note du jury</Text>
            <Text style={styles.noteValeur}>{candidat.noteJury ?? 0}/20</Text>
          </View>
          <View style={styles.carteNote}>
            <Text style={styles.noteLabel}>Votes du public</Text>
            <Text style={[styles.noteValeur, { color: COLORS.votes }]}>{entreeClassement?.nombreVotes ?? 0}</Text>
          </View>
        </View>

        <MessageErreur message={erreur} />

        {estConnecte && solde !== null && (
          <Pressable style={styles.badgeSolde} onPress={() => navigation.navigate('Portefeuille')}>
            <Text style={styles.badgeSoldeTexte}>🪙 Solde : {solde} piece{solde > 1 ? 's' : ''}</Text>
          </Pressable>
        )}

        {candidat.statut !== 'ELIMINE' && (
          <PrimaryButton
            titre="Voter pour ce candidat"
            onPress={(e) => voter(e)}
            couleur={COLORS.votes}
            chargement={voteEnCours}
          />
        )}

        {candidat.videoUrl ? (
          <View style={styles.lecteurVideo}>
            <Video
              source={{ uri: resoudreUrlImage(candidat.videoUrl) }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              posterSource={candidat.photoUrl ? { uri: resoudreUrlImage(candidat.photoUrl) } : undefined}
              usePoster
            />
          </View>
        ) : (
          <View style={styles.pasDeVideoConteneur}>
            <PlayCircle color={COLORS.texteAtténué} size={28} />
            <Text style={styles.pasDeVideo}>Aucun extrait video disponible pour ce candidat.</Text>
          </View>
        )}
      </View>

      {confettis.map((c) => (
        <ConfettiVote key={c.confettiId} x={c.x} y={c.y} onTermine={() => retirerConfetti(c.confettiId)} />
      ))}

    <BottomTabBar navigation={navigation} variante="votes" ongletActif="votes" />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  ligneEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  photo: { width: 96, height: 96, borderRadius: 48, marginBottom: 16 },
  boutonPartage: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.fondCarte, alignItems: 'center', justifyContent: 'center' },
  nom: { color: '#fff', fontSize: 22, fontWeight: '800' },
  ville: { color: COLORS.texteAtténué, fontSize: 14, marginTop: 4 },
  statut: { color: COLORS.musique, fontWeight: '700', fontSize: 12, marginTop: 8 },
  ligneCartes: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 18 },
  carteNote: { flex: 1, alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 14 },
  noteLabel: { color: COLORS.texteAtténué, fontSize: 12 },
  noteValeur: { color: COLORS.or, fontSize: 18, fontWeight: '800', marginTop: 4 },
  lecteurVideo: { borderRadius: 14, overflow: 'hidden', marginTop: 20, backgroundColor: '#000' },
  video: { width: '100%', aspectRatio: 16 / 9 },
  pasDeVideoConteneur: { backgroundColor: COLORS.fondCarte, borderRadius: 14, padding: 24, marginTop: 20, alignItems: 'center', gap: 8 },
  pasDeVideo: { color: COLORS.texteAtténué, fontSize: 13, textAlign: 'center' },
  badgeSolde: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,204,33,0.15)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 12 },
  badgeSoldeTexte: { color: COLORS.or, fontSize: 13, fontWeight: '800' },
});
