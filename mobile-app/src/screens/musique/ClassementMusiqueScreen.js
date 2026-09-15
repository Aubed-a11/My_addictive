import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, FlatList, View, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Headphones, Download, ShoppingBag } from 'lucide-react-native';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

const CONFIG_TYPE = {
  streaming: { titre: 'Top Streaming', libelleCompteur: (t) => `${t.compteurEcoutes} ecoutes`, Icone: Headphones, couleur: '#F97316' },
  telechargement_gratuit: { titre: 'Top Telechargement gratuit', libelleCompteur: (t) => `${t.compteurTelechargements} telechargements`, Icone: Download, couleur: '#3B82F6' },
  ventes: { titre: 'Top Vente', libelleCompteur: () => null, Icone: ShoppingBag, couleur: COLORS.or },
};

/** Classement musical (section "Tous nos Tops") : type transmis par la tuile choisie sur l'accueil Musique. */
export default function ClassementMusiqueScreen({ navigation, route }) {
  const type = route?.params?.type || 'streaming';
  const config = CONFIG_TYPE[type] || CONFIG_TYPE.streaming;
  const [titres, setTitres] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/musique/classements', { params: { type, page: 0, size: 30 } });
      setTitres(data.content || []);
    })();
  }, [type]);

  return (
    <ImageBackground source={require('../../../assets/images/scene_musique.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={styles.entete}>
        <config.Icone size={20} color={config.couleur} />
        <Text style={styles.titre}>{config.titre}</Text>
      </View>
      <FlatList
                style={{ flex: 1 }}
        data={titres}
        keyExtractor={(t) => String(t.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        renderItem={({ item, index }) => {
          const compteur = config.libelleCompteur(item);
          const couleurRang = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : config.couleur;
          return (
            <View style={styles.ligne}>
              <Text style={[styles.rang, { color: couleurRang }]}>{index + 1}</Text>
              {item.imageUrl ? (
                <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.pochette} />
              ) : (
                <IconePlaceholder style={styles.pochette} tailleIcone="55%" />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.ligneTitre} numberOfLines={1}>{item.nom}</Text>
                <Text style={styles.ligneMeta} numberOfLines={1}>{item.artiste}</Text>
              </View>
              {compteur && <Text style={styles.compteur}>{compteur}</Text>}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.vide}>Rien a afficher pour ce classement pour l'instant.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="musique" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  titre: { color: '#fff', fontSize: 20, fontWeight: '800' },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  ligne: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 10, marginBottom: 10 },
  rang: { fontWeight: '800', fontSize: 18, width: 24, textAlign: 'center' },
  pochette: { width: 46, height: 46, borderRadius: 8 },
  ligneTitre: { color: '#fff', fontWeight: '700' },
  ligneMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
  compteur: { color: COLORS.texteAtténué, fontSize: 11 },
});
