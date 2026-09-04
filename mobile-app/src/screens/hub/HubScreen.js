import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Newspaper, Music, Ticket, Radio, TrendingUp, ShoppingBag } from 'lucide-react-native';
import Logo from '../../components/Logo';
import SpotlightCarousel from '../../components/SpotlightCarousel';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';
import { COLORS, DEGRADES } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { resoudreUrlImage } from '../../utils/urlImage';

const RUBRIQUES = [
  { cle: 'Media', titre: 'Media', sousTitre: 'Actualites, showbiz et videos', degrade: DEGRADES.media, Icone: Newspaper, ecran: 'MediaHome' },
  { cle: 'Musique', titre: 'Musique', sousTitre: 'Titres, albums, classements', degrade: DEGRADES.musique, Icone: Music, ecran: 'MusiqueHome' },
  { cle: 'Billetterie', titre: 'Billetterie', sousTitre: 'Billets et places de concerts', degrade: DEGRADES.billetterie, Icone: Ticket, ecran: 'EvenementsListe' },
  { cle: 'Livestream', titre: 'Livestream', sousTitre: 'Diffusion en direct, replay et chat', degrade: DEGRADES.live, Icone: Radio, ecran: 'EvenementsListe' },
  { cle: 'Votes', titre: 'Votes', sousTitre: 'Talent shows, classements', degrade: DEGRADES.votes, Icone: TrendingUp, ecran: 'CompetitionsListe' },
  { cle: 'Boutique', titre: 'Boutique', sousTitre: 'Marketplace multi-vendeurs', degrade: DEGRADES.boutique, Icone: ShoppingBag, ecran: 'BoutiqueHome' },
];

/**
 * Ecran d'accueil hub (section 3.3) : aucune rubrique ne s'ouvre
 * automatiquement, l'utilisateur clique toujours sur une tuile. Accessible
 * sans connexion (regle d'acces libre, section 3.1). Design aligne sur
 * l'identite de marque (fond noir, accent or, tuiles en degrade).
 */
export default function HubScreen({ navigation }) {
  const { estConnecte, utilisateur } = useAuth();

  return (
    <ImageBackground source={require('../../../assets/images/scene_hub.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.contenu, { flexGrow: 1, paddingBottom: HAUTEUR_BARRE_ONGLETS + 20 }]}>
          <View>
            <View style={styles.entete}>
              <Logo taille={34} />
              <Pressable onPress={() => navigation.navigate('Profil')} style={styles.avatar}>
                {estConnecte && utilisateur?.photoUrl ? (
                  <Image source={{ uri: resoudreUrlImage(utilisateur.photoUrl) }} style={StyleSheet.absoluteFill} />
                ) : (
                  <Text style={styles.avatarTexte}>{estConnecte ? (utilisateur?.nomComplet?.[0] || '?') : '?'}</Text>
                )}
              </Pressable>
            </View>

            {estConnecte && (
              <Text style={styles.bienvenue}>
                Bienvenue{utilisateur?.nomComplet ? `, ${utilisateur.nomComplet.split(' ')[0]}` : ''} sur MyAddictive
              </Text>
            )}

            {!estConnecte && (
              <Pressable style={styles.bandeauConnexion} onPress={() => navigation.navigate('Connexion')}>
                <Text style={styles.bandeauTexte}>
                  Vous naviguez en visiteur.  ·  Connectez-vous pour acheter, voter ou publier.
                </Text>
              </Pressable>
            )}

            <SpotlightCarousel navigation={navigation} />
          </View>

          {/* Comble l'espace disponible pour faire descendre les tuiles vers la barre du bas
              quand il n'y a peu ou pas de contenu au-dessus (carrousels vides). */}
          <View style={{ flex: 1, minHeight: 12 }} />

          <View style={styles.grille}>
            {RUBRIQUES.map((r) => (
              <Pressable
                key={r.cle}
                style={({ pressed }) => [styles.tuileConteneur, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
                onPress={() => navigation.navigate(r.ecran, r.cle === 'Livestream' ? { mode: 'live' } : r.cle === 'Billetterie' ? { mode: 'billetterie' } : undefined)}
              >
                <LinearGradient colors={r.degrade} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tuile}>
                  <View style={styles.icone}>
                    <r.Icone color="#fff" size={20} />
                  </View>
                  <Text style={styles.tuileTitre}>{r.titre}</Text>
                  <Text style={styles.tuileSousTitre} numberOfLines={2}>{r.sousTitre}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
      <BottomTabBar navigation={navigation} variante="hub" ongletActif="accueil" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.72)' },
  contenu: { padding: 20, paddingTop: 12 },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.or, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarTexte: { color: '#0A0A0F', fontWeight: '800' },
  bienvenue: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 16 },
  bandeauConnexion: { backgroundColor: 'rgba(22,21,31,0.85)', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: COLORS.bordure },
  bandeauTexte: { color: COLORS.texteAtténué, fontSize: 13 },
  grille: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tuileConteneur: { width: '48%', height: 130, marginBottom: 14, borderRadius: 18, overflow: 'hidden' },
  tuile: { flex: 1, padding: 16 },
  icone: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tuileTitre: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 4 },
  tuileSousTitre: { color: 'rgba(255,255,255,0.75)', fontSize: 11, lineHeight: 15, minHeight: 30 },
});
