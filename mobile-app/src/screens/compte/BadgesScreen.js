import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, Ticket, TrendingUp, ShoppingBag } from 'lucide-react-native';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/**
 * Badges de fidelite selon l'activite (section 9.2) : votes, billets,
 * achats. Le calcul agrege les historiques deja exposes par chaque
 * microservice (pas de nouvelle donnee cote backend necessaire).
 */
const SEUILS = [
  { min: 0, label: 'Debutant', couleur: '#9A97AE' },
  { min: 5, label: 'Bronze', couleur: '#CD7F32' },
  { min: 15, label: 'Argent', couleur: '#C0C0C0' },
  { min: 30, label: 'Or', couleur: '#FFCC21' },
  { min: 50, label: 'Platine', couleur: '#8B5CF6' },
];

function calculerBadge(total) {
  return [...SEUILS].reverse().find((s) => total >= s.min) || SEUILS[0];
}

export default function BadgesScreen({ navigation }) {
  const [chargement, setChargement] = useState(true);
  const [stats, setStats] = useState({ votes: 0, billets: 0, achats: 0 });

  useEffect(() => {
    (async () => {
      const resultats = await Promise.allSettled([
        client.get('/api/votes/mes-votes'),
        client.get('/api/live/billets/mes-billets'),
        client.get('/api/musique/mes-achats'),
        client.get('/api/boutique/commandes'),
      ]);
      const compter = (r) => (r.status === 'fulfilled' ? r.value.data.length : 0);
      setStats({
        votes: compter(resultats[0]),
        billets: compter(resultats[1]),
        achats: compter(resultats[2]) + compter(resultats[3]),
      });
      setChargement(false);
    })();
  }, []);

  const total = stats.votes + stats.billets + stats.achats;
  const badge = calculerBadge(total);

  if (chargement) return <ActivityIndicator color={COLORS.or} style={{ marginTop: 40 }} />;

  return (
    <ImageBackground source={require('../../../assets/images/scene_splash.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={{ padding: 20 }}>
        <View style={[styles.carteBadge, { borderColor: badge.couleur }]}>
          <View style={[styles.iconeBadge, { backgroundColor: badge.couleur }]}>
            <Award color="#0A0A0F" size={28} />
          </View>
          <Text style={styles.nomBadge}>{badge.label}</Text>
          <Text style={styles.sousTitreBadge}>{total} action{total > 1 ? 's' : ''} au total</Text>
        </View>

        <View style={styles.grilleStats}>
          <View style={styles.carteStat}>
            <TrendingUp color={COLORS.votes} size={20} />
            <Text style={styles.valeurStat}>{stats.votes}</Text>
            <Text style={styles.labelStat}>Votes</Text>
          </View>
          <View style={styles.carteStat}>
            <Ticket color={COLORS.billetterie} size={20} />
            <Text style={styles.valeurStat}>{stats.billets}</Text>
            <Text style={styles.labelStat}>Billets</Text>
          </View>
          <View style={styles.carteStat}>
            <ShoppingBag color={COLORS.boutique} size={20} />
            <Text style={styles.valeurStat}>{stats.achats}</Text>
            <Text style={styles.labelStat}>Achats</Text>
          </View>
        </View>

        <Text style={styles.sectionTitre}>Prochains paliers</Text>
        {SEUILS.filter((s) => s.min > total).map((s) => (
          <View key={s.label} style={styles.lignePalier}>
            <View style={[styles.pucePalier, { backgroundColor: s.couleur }]} />
            <Text style={styles.textePalier}>{s.label} — a partir de {s.min} actions ({s.min - total} restantes)</Text>
          </View>
        ))}
      </View>
    <BottomTabBar navigation={navigation} variante="compte" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  carteBadge: { alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 18, padding: 24, borderWidth: 2 },
  iconeBadge: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  nomBadge: { color: '#fff', fontSize: 22, fontWeight: '800' },
  sousTitreBadge: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
  grilleStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  carteStat: { flex: 1, alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 14, padding: 14, marginHorizontal: 4 },
  valeurStat: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 6 },
  labelStat: { color: COLORS.texteAtténué, fontSize: 11, marginTop: 2 },
  sectionTitre: { color: '#fff', fontWeight: '700', fontSize: 15, marginTop: 26, marginBottom: 10 },
  lignePalier: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  pucePalier: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  textePalier: { color: COLORS.texteAtténué, fontSize: 13 },
});
