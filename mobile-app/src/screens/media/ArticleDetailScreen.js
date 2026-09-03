import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Share2, Heart, Eye, BookOpen, Video } from 'lucide-react-native';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import EnteteLogo from '../../components/EnteteLogo';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

export default function ArticleDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { estConnecte } = useAuth();
  const [article, setArticle] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [favori, setFavori] = useState(false);
  const [favoriId, setFavoriId] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await client.get(`/api/media/articles/${id}`);
      setArticle(data);
      setChargement(false);
    })();
  }, [id]);

  useEffect(() => {
    if (!estConnecte) return;
    (async () => {
      try {
        const { data: favoris } = await client.get('/api/compte/favoris');
        const existant = (favoris || []).find((f) => f.typeCible === 'ARTICLE' && f.referenceId === String(id));
        if (existant) { setFavori(true); setFavoriId(existant.id); }
      } catch {}
    })();
  }, [id, estConnecte]);

  const basculerFavori = async () => {
    if (!estConnecte) { navigation.navigate('Connexion', { returnTo: 'ArticleDetail', returnToParams: { id } }); return; }
    if (favori && favoriId) {
      setFavori(false);
      try { await client.delete(`/api/compte/favoris/${favoriId}`); } catch { setFavori(true); }
    } else {
      setFavori(true);
      try {
        const { data } = await client.post('/api/compte/favoris', { typeCible: 'ARTICLE', referenceId: String(id) });
        setFavoriId(data.id);
      } catch { setFavori(false); }
    }
  };

  // Partage sur les reseaux sociaux (section 4.1).
  const partager = async () => {
    if (!article) return;
    try {
      await Share.share({
        message: `${article.titre}\n\n${article.chapo || ''}\n\nA lire sur My Addictive.`,
        title: article.titre,
      });
    } catch {
      // L'utilisateur a simplement annule le partage, rien a faire.
    }
  };

  if (chargement) return <ActivityIndicator color={COLORS.media} style={{ marginTop: 40 }} />;
  if (!article) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <EnteteLogo />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: HAUTEUR_BARRE_ONGLETS + 16 }}>
        {article.videoUrl ? (
          <View style={styles.videoConteneur}>
            <WebView
              source={{ uri: article.videoUrl }}
              style={styles.video}
              allowsFullscreenVideo
              javaScriptEnabled
            />
          </View>
        ) : (
          article.imageUrl && <Image source={{ uri: resoudreUrlImage(article.imageUrl) }} style={styles.image} />
        )}
        <View style={styles.ligneTitre}>
          <Text style={styles.titre}>{article.titre}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={basculerFavori} style={styles.boutonPartage}>
              <Heart color={favori ? COLORS.media : '#fff'} size={20} fill={favori ? COLORS.media : 'none'} />
            </Pressable>
            <Pressable onPress={partager} style={styles.boutonPartage}>
              <Share2 color={COLORS.media} size={20} />
            </Pressable>
          </View>
        </View>
        <View style={styles.ligneMeta}>
          <View style={styles.pastilleMeta}>
            {article.videoUrl ? <Video color={COLORS.media} size={13} /> : <BookOpen color={COLORS.media} size={13} />}
            <Text style={styles.pastilleMetaTexte}>{article.categorie}</Text>
          </View>
          <View style={[styles.pastilleMeta, { backgroundColor: 'rgba(255,204,33,0.15)' }]}>
            <Eye color={COLORS.or} size={13} />
            <Text style={[styles.pastilleMetaTexte, { color: COLORS.or, fontWeight: '700' }]}>{article.compteurVues} vues</Text>
          </View>
        </View>
        {article.chapo && <Text style={styles.chapo}>{article.chapo}</Text>}
        <Text style={styles.contenu}>{article.contenu}</Text>
      </ScrollView>
      <BottomTabBar navigation={navigation} variante="media" ongletActif="rubrique" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  image: { width: '100%', height: 200, borderRadius: 14, marginBottom: 16, backgroundColor: COLORS.fondCarte },
  videoConteneur: { width: '100%', aspectRatio: 16 / 9, borderRadius: 14, overflow: 'hidden', marginBottom: 16, backgroundColor: '#000' },
  video: { flex: 1, backgroundColor: '#000' },
  ligneTitre: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8, flex: 1, marginRight: 10 },
  boutonPartage: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.fondCarte, alignItems: 'center', justifyContent: 'center' },
  ligneMeta: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  pastilleMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.fondCarte, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  pastilleMetaTexte: { color: COLORS.texteAtténué, fontSize: 12, fontWeight: '600' },
  chapo: { color: '#fff', fontSize: 16, fontStyle: 'italic', marginBottom: 14 },
  contenu: { color: COLORS.texteAtténué, fontSize: 15, lineHeight: 22 },
});
