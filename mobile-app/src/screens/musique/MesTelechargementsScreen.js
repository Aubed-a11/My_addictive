import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Trash2, PlayCircle } from 'lucide-react-native';
import * as HorsLigne from '../../services/telechargementsHorsLigne';
import { COLORS } from '../../theme/colors';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/** Mode hors ligne (section 5.2) : titres telecharges localement pour ecoute sans connexion. */
export default function MesTelechargementsScreen({ navigation }) {
  const [telechargements, setTelechargements] = useState([]);

  const charger = useCallback(async () => {
    setTelechargements(await HorsLigne.listerTelechargements());
  }, []);

  // Recharge la liste a chaque retour sur cet ecran (ex. apres un nouveau telechargement).
  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  const supprimer = async (id) => {
    await HorsLigne.supprimerTelechargement(id);
    charger();
  };

  return (
    <ImageBackground source={require('../../../assets/images/scene_musique.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Text style={styles.titre}>Mes telechargements</Text>
      <Text style={styles.sousTitre}>Titres disponibles hors connexion, stockes sur cet appareil.</Text>
      <FlatList
                style={{ flex: 1 }}
        data={telechargements}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.ligne}>
            <PlayCircle color={COLORS.musique} size={22} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.ligneTitre}>{item.nom}</Text>
              <Text style={styles.ligneMeta}>{item.artiste}</Text>
            </View>
            <Pressable onPress={() => supprimer(item.id)}>
              <Trash2 color={COLORS.texteAtténué} size={18} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.vide}>Aucun titre telecharge. Ouvrez un titre et appuyez sur "Telecharger" pour l'ecouter hors ligne.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="musique" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 20, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10 },
  sousTitre: { color: COLORS.texteAtténué, fontSize: 12, paddingHorizontal: 16, marginTop: 6 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40, paddingHorizontal: 20 },
  ligne: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 14, marginBottom: 10 },
  ligneTitre: { color: '#fff', fontWeight: '600' },
  ligneMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
});
