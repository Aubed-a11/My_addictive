import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Linking } from 'react-native';
import { Play, Sparkles } from 'lucide-react-native';
import client from '../api/client';
import { COLORS } from '../theme/colors';
import { resoudreUrlImage } from '../utils/urlImage';
import { extraireIdYoutube, vignetteYoutube } from '../utils/youtube';
import IconePlaceholder from './IconePlaceholder';

/**
 * Section "Brand New" (accueil Musique), inspiree de la maquette de
 * reference fournie : derniers clips officiels, vignette YouTube avec
 * bouton play, ouvre directement la video sur YouTube au clic (pas de
 * lecteur video integre pour l'instant - plus simple et plus fiable que
 * d'embarquer un player YouTube, notamment sur web).
 */
export default function BrandNew({ navigation }) {
  const [titres, setTitres] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/api/musique/titres/nouveautes', { params: { page: 0, size: 10 } });
        setTitres((data.content || []).filter((t) => extraireIdYoutube(t.youtubeUrl)));
      } catch {}
    })();
  }, []);

  if (titres.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.entete}>
        <View style={styles.barreVerticale} />
        <Sparkles size={16} color={COLORS.musique} />
        <Text style={styles.titreSection}>BRAND NEW</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liste}>
        {titres.map((titre) => {
          const idVideo = extraireIdYoutube(titre.youtubeUrl);
          return (
            <View key={titre.id} style={styles.carte}>
              <Pressable onPress={() => Linking.openURL(titre.youtubeUrl).catch(() => {})}>
                <Image source={{ uri: vignetteYoutube(idVideo) }} style={styles.vignette} resizeMode="cover" />
                <View style={styles.voileVignette} />
                <View style={styles.boutonPlay}>
                  <Play color="#fff" size={20} fill="#fff" />
                </View>
                <View style={styles.enteteVignette}>
                  {titre.imageUrl ? (
                    <Image source={{ uri: resoudreUrlImage(titre.imageUrl) }} style={styles.avatarArtiste} />
                  ) : (
                    <IconePlaceholder style={styles.avatarArtiste} tailleIcone="60%" />
                  )}
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.artisteVideo} numberOfLines={1}>{titre.artiste} - {titre.nom}</Text>
                  </View>
                </View>
              </Pressable>
              <Pressable style={styles.piedCarte} onPress={() => navigation.navigate('TitreDetail', { id: titre.id })}>
                <Text style={styles.nomTitre} numberOfLines={1}>{titre.nom}</Text>
                <Text style={styles.artisteLien} numberOfLines={1}>{titre.artiste}</Text>
                {titre.genre && <Text style={styles.genreLien} numberOfLines={1}>{titre.genre}</Text>}
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 22 },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  barreVerticale: { width: 4, height: 18, backgroundColor: COLORS.musique, borderRadius: 2 },
  titreSection: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  liste: { paddingHorizontal: 16, gap: 14 },
  carte: { width: 220, borderRadius: 14, overflow: 'hidden', backgroundColor: COLORS.fondCarte },
  vignette: { width: '100%', height: 124 },
  voileVignette: { ...StyleSheet.absoluteFillObject, height: 124, backgroundColor: 'rgba(0,0,0,0.15)' },
  boutonPlay: {
    position: 'absolute', top: 42, left: 92, width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(220,38,38,0.9)', alignItems: 'center', justifyContent: 'center',
  },
  enteteVignette: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: 'rgba(0,0,0,0.55)' },
  avatarArtiste: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#fff' },
  artisteVideo: { color: '#fff', fontSize: 12, fontWeight: '700' },
  piedCarte: { padding: 10, backgroundColor: 'rgba(255,255,255,0.03)' },
  nomTitre: { color: '#fff', fontWeight: '700', fontSize: 13 },
  artisteLien: { color: COLORS.musique, fontSize: 11, marginTop: 4, fontWeight: '600' },
  genreLien: { color: COLORS.texteAtténué, fontSize: 10, marginTop: 2 },
});
