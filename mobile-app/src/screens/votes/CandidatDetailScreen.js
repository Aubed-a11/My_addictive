import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import EnteteLogo from '../../components/EnteteLogo';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/** Mini-profil public du candidat, avec extrait video (section 7.1 et 7.2). */
export default function CandidatDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const [candidat, setCandidat] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await client.get(`/api/votes/candidats/${id}`);
      setCandidat(data);
    })();
  }, [id]);

  if (!candidat) return <ActivityIndicator color={COLORS.votes} style={{ marginTop: 40 }} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <EnteteLogo />
      <View style={{ padding: 20 }}>
        {candidat.photoUrl ? (
          <Image source={{ uri: resoudreUrlImage(candidat.photoUrl) }} style={styles.photo} />
        ) : (
          <IconePlaceholder style={styles.photo} />
        )}
        <Text style={styles.nom}>{candidat.nom}</Text>
        <Text style={styles.ville}>{candidat.ville}</Text>
        <Text style={[styles.statut, candidat.statut === 'ELIMINE' && { color: '#F87171' }]}>{candidat.statut}</Text>

        <View style={styles.carteNote}>
          <Text style={styles.noteLabel}>Note du jury</Text>
          <Text style={styles.noteValeur}>{candidat.noteJury ?? 0}/20</Text>
        </View>

        {candidat.videoUrl ? (
          <View style={styles.lecteur}>
            <Text style={styles.lecteurTexte}>
              Extrait video du candidat (a integrer : lecteur pointant vers {candidat.videoUrl})
            </Text>
          </View>
        ) : (
          <Text style={styles.pasDeVideo}>Aucun extrait video disponible pour ce candidat.</Text>
        )}
      </View>
    <BottomTabBar navigation={navigation} variante="votes" ongletActif="votes" />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  photo: { width: 96, height: 96, borderRadius: 48, marginBottom: 16 },
  nom: { color: '#fff', fontSize: 22, fontWeight: '800' },
  ville: { color: COLORS.texteAtténué, fontSize: 14, marginTop: 4 },
  statut: { color: COLORS.musique, fontWeight: '700', fontSize: 12, marginTop: 8 },
  carteNote: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 16, marginTop: 20 },
  noteLabel: { color: COLORS.texteAtténué, fontSize: 13 },
  noteValeur: { color: COLORS.or, fontSize: 18, fontWeight: '800' },
  lecteur: { backgroundColor: COLORS.fondCarte, borderRadius: 14, padding: 20, marginTop: 20, alignItems: 'center' },
  lecteurTexte: { color: COLORS.texteAtténué, fontSize: 12, textAlign: 'center' },
  pasDeVideo: { color: COLORS.texteAtténué, fontSize: 13, textAlign: 'center', marginTop: 30 },
});
