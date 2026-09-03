import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import MessageErreur from '../../components/MessageErreur';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import { TAUX_PIECE_FCFA } from '../../theme/votes';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import EnteteLogo from '../../components/EnteteLogo';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/**
 * Vote payant par pieces (section 7.1) : un vote n'est comptabilise
 * qu'apres depense d'une piece prealablement achetee. Le classement
 * combine desormais le vote du public ET la note du jury, selon la
 * ponderation definie sur la competition ("score final pondere").
 * Les candidats sont affiches tries par classement, avec leur position.
 */
export default function CandidatsScreen({ navigation, route }) {
  const { competitionId, nom } = route.params;
  const { estConnecte } = useAuth();
  const [candidats, setCandidats] = useState([]);
  const [classement, setClassement] = useState([]);
  const [erreur, setErreur] = useState(null);

  const charger = useCallback(async () => {
    const [{ data: c }, { data: cl }] = await Promise.all([
      client.get(`/api/votes/competitions/${competitionId}/candidats`),
      client.get(`/api/votes/competitions/${competitionId}/classement`),
    ]);
    setCandidats(c);
    setClassement(cl);
  }, [competitionId]);

  useEffect(() => {
    charger();
    const intervalle = setInterval(charger, 8000);
    return () => clearInterval(intervalle);
  }, [charger]);

  const voter = async (candidatId) => {
    if (!estConnecte) {
      navigation.navigate('Connexion', { returnTo: 'Candidats', returnToParams: route.params });
      return;
    }
    setErreur(null);
    try {
      await client.post('/api/votes/voter', { candidatId });
      charger();
    } catch (e) {
      setErreur(e.message);
    }
  };

  const trouverClassement = (candidatId) => classement.find((c) => c.candidatId === candidatId);

  // Trie les candidats par score decroissant (ceux sans score calcule restent en fin de liste).
  const candidatsTries = [...candidats].sort((a, b) => {
    const scoreA = trouverClassement(a.id)?.scoreFinal ?? -1;
    const scoreB = trouverClassement(b.id)?.scoreFinal ?? -1;
    return scoreB - scoreA;
  });

  return (
    <ImageBackground source={require('../../../assets/images/scene_musique.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <Text style={styles.titre}>{nom}</Text>
      <Text style={styles.sousTitre}>Classement pondere : vote du public + note du jury</Text>
      <Text style={styles.tauxConversion}>1 piece = {TAUX_PIECE_FCFA} FCFA</Text>

      {!estConnecte && (
        <Pressable style={styles.bandeauConnexion} onPress={() => navigation.navigate('Connexion', { returnTo: 'Candidats', returnToParams: route.params })}>
          <Text style={styles.bandeauTexte}>Connectez-vous pour voter</Text>
        </Pressable>
      )}

      <MessageErreur message={erreur} />
      <FlatList
                style={{ flex: 1 }}
        data={candidatsTries}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        renderItem={({ item, index }) => {
          const entree = trouverClassement(item.id);
          const couleurPosition = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : COLORS.votes;
          return (
            <Pressable style={styles.carte} onPress={() => navigation.navigate('CandidatDetail', { id: item.id, nom: item.nom })}>
              <View style={[styles.pastillePosition, { backgroundColor: couleurPosition }]}>
                <Text style={[styles.positionTexte, index < 3 && { color: '#0A0A0F' }]}>{index + 1}</Text>
              </View>
              {item.photoUrl ? <Image source={{ uri: resoudreUrlImage(item.photoUrl) }} style={styles.photo} /> : <IconePlaceholder style={styles.photo} />}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.carteTitre}>{item.nom}</Text>
                <Text style={styles.carteMeta}>{item.ville} · {item.statut}</Text>
                <View style={styles.ligneScore}>
                  <Text style={styles.votes}>{entree?.nombreVotes ?? 0} votes</Text>
                  <Text style={styles.noteJury}>Jury : {entree?.noteJury ?? 0}/20</Text>
                  <Text style={styles.score}>Score : {entree ? entree.scoreFinal.toFixed(1) : '0.0'}</Text>
                </View>
              </View>
              <Pressable
                style={[styles.bouton, item.statut === 'ELIMINE' && { opacity: 0.4 }]}
                onPress={() => voter(item.id)}
                disabled={item.statut === 'ELIMINE'}
              >
                <Text style={styles.boutonTexte}>Voter</Text>
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={<Text style={styles.vide}>Aucun candidat pour cette competition.</Text>}
      />
      <BottomTabBar navigation={navigation} variante="votes" ongletActif="votes" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10 },
  sousTitre: { color: COLORS.texteAtténué, fontSize: 12, paddingHorizontal: 16, marginTop: 4 },
  tauxConversion: { color: COLORS.or, fontSize: 12, fontWeight: '600', paddingHorizontal: 16, marginTop: 6 },
  bandeauConnexion: { backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 12, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: COLORS.votes, alignItems: 'center' },
  bandeauTexte: { color: COLORS.votes, fontWeight: '700', fontSize: 13 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  carte: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3,
  },
  pastillePosition: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.votes, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  positionTexte: { color: '#fff', fontWeight: '800', fontSize: 12 },
  photo: { width: 52, height: 52, borderRadius: 26 },
  carteTitre: { color: '#fff', fontWeight: '700' },
  carteMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 2 },
  ligneScore: { flexDirection: 'row', gap: 10, marginTop: 6, flexWrap: 'wrap' },
  votes: { color: COLORS.votes, fontWeight: '700', fontSize: 11 },
  noteJury: { color: COLORS.or, fontSize: 11 },
  score: { color: COLORS.texteAtténué, fontSize: 11 },
  bouton: { backgroundColor: COLORS.votes, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  boutonTexte: { color: '#fff', fontWeight: '700', fontSize: 11 },
});
