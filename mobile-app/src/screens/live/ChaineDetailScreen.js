import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star } from 'lucide-react-native';
import client from '../../api/client';
import MessageErreur from '../../components/MessageErreur';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/**
 * Page de chaine (section 6.3) : regroupe tous les evenements passes, en
 * cours et a venir de l'organisateur/artiste, avec possibilite de
 * s'abonner (notifications) et de rejoindre le fan club payant (section
 * 9.2 : acces anticipe, contenu exclusif).
 */
export default function ChaineDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { estConnecte } = useAuth();
  const [chaine, setChaine] = useState(null);
  const [evenements, setEvenements] = useState([]);
  const [statutFanClub, setStatutFanClub] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [chargementFanClub, setChargementFanClub] = useState(false);
  const [erreur, setErreur] = useState(null);

  const chargerFanClub = async () => {
    if (!estConnecte) return;
    try {
      const { data } = await client.get(`/api/live/chaines/${id}/fan-club/statut`);
      setStatutFanClub(data);
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
    })();
  }, [id]);

  const abonner = async () => {
    if (!estConnecte) { navigation.navigate('Connexion'); return; }
    await client.post(`/api/live/abonnements-chaine/${id}`);
    const { data } = await client.get(`/api/live/chaines/${id}`);
    setChaine(data);
  };

  const rejoindreFanClub = async () => {
    if (!estConnecte) { navigation.navigate('Connexion'); return; }
    setErreur(null);
    setChargementFanClub(true);
    try {
      await client.post(`/api/live/chaines/${id}/fan-club/initier`);
      await chargerFanClub();
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

        <Pressable style={styles.boutonAbonnement} onPress={abonner}>
          <Text style={styles.boutonTexte}>S'abonner a cette chaine</Text>
        </Pressable>

        <MessageErreur message={erreur} />

        {estFan ? (
          <View style={styles.carteFanActif}>
            <Text style={styles.carteFanTitre}>Vous etes membre du fan club</Text>
            <Text style={styles.carteFanMeta}>
              Actif jusqu'au {new Date(statutFanClub.dateExpiration).toLocaleDateString('fr-FR')} · acces anticipe et contenu exclusif
            </Text>
          </View>
        ) : (
          <Pressable style={styles.boutonFanClub} onPress={rejoindreFanClub} disabled={chargementFanClub}>
            <Star color="#0A0A0F" size={16} />
            <Text style={styles.boutonFanClubTexte}>
              {chargementFanClub ? 'Traitement...' : 'Rejoindre le fan club — 2000 FCFA / mois'}
            </Text>
          </Pressable>
        )}
        <Text style={styles.notePetit}>Acces anticipe aux billets et contenu exclusif de cette chaine.</Text>

        <Text style={styles.sectionTitre}>Evenements de la chaine</Text>
      </View>

      {chargement && <ActivityIndicator color={COLORS.billetterie} />}

      <FlatList
                style={{ flex: 1 }}
        data={evenements}
        keyExtractor={(e) => String(e.id)}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
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
  boutonAbonnement: { backgroundColor: COLORS.billetterie, borderRadius: 24, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  boutonTexte: { color: '#fff', fontWeight: '700', fontSize: 13 },
  boutonFanClub: { flexDirection: 'row', gap: 8, backgroundColor: COLORS.or, borderRadius: 24, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  boutonFanClubTexte: { color: '#0A0A0F', fontWeight: '800', fontSize: 13 },
  carteFanActif: { backgroundColor: 'rgba(255,204,33,0.1)', borderRadius: 14, padding: 14, marginTop: 10, borderWidth: 1, borderColor: COLORS.or },
  carteFanTitre: { color: COLORS.or, fontWeight: '700', fontSize: 13 },
  carteFanMeta: { color: COLORS.texteAtténué, fontSize: 11, marginTop: 4 },
  notePetit: { color: COLORS.texteAtténué, fontSize: 11, marginTop: 8, textAlign: 'center' },
  sectionTitre: { color: '#fff', fontWeight: '700', fontSize: 15, marginTop: 24 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 30 },
  carte: { backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 14, marginBottom: 10 },
  carteTitre: { color: '#fff', fontWeight: '700' },
  carteMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
});
