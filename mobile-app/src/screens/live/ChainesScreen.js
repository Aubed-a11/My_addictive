import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import EnteteLogo from '../../components/EnteteLogo';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

export default function ChainesScreen({ navigation }) {
  const [chaines, setChaines] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/live/chaines', { params: { page: 0, size: 30 } });
      setChaines(data.content || []);
    })();
  }, []);

  return (
    <ImageBackground source={require('../../../assets/images/scene_connexion.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <Text style={styles.titre}>Chaines</Text>
      <FlatList
                style={{ flex: 1 }}
        data={chaines}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}
        renderItem={({ item }) => (
          <Pressable style={styles.carte} onPress={() => navigation.navigate('ChaineDetail', { id: item.id })}>
            {item.imageUrl ? (
              <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.portrait} />
            ) : (
              <IconePlaceholder style={styles.portrait} tailleIcone="55%" />
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.carteTitre}>{item.nom}</Text>
              <Text style={styles.carteMeta}>{item.nombreAbonnes} abonnes</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.vide}>Aucune chaine pour le moment.</Text>}
      />
      <BottomTabBar navigation={navigation} variante="live" ongletActif="live" />
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  carte: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3,
  },
  portrait: { width: 52, height: 52, borderRadius: 26 },
  carteTitre: { color: '#fff', fontWeight: '700' },
  carteMeta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 4 },
  bouton: { backgroundColor: COLORS.billetterie, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20 },
  boutonTexte: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
