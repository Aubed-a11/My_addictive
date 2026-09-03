import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ImageBackground, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import PrimaryButton from '../../components/PrimaryButton';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';
import EnteteLogo from '../../components/EnteteLogo';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';

/** Rubrique 6, "Mon compte" (section 9) : profil, achats, billets, portefeuille, favoris. */
export default function ProfilScreen({ navigation }) {
  const { estConnecte, utilisateur, deconnecter } = useAuth();

  if (!estConnecte) {
    return (
      <ImageBackground source={require('../../../assets/images/scene_hub.jpg')} style={styles.safe} resizeMode="cover">
        <View style={styles.voile} />
        <SafeAreaView style={{ flex: 1 }}>
          <EnteteLogo />
          <View style={styles.centre}>
            <Text style={styles.titre}>Mon compte</Text>
            <Text style={styles.sousTitre}>Connectez-vous pour acceder a votre profil, vos billets, votes et achats.</Text>
            <PrimaryButton titre="Se connecter" onPress={() => navigation.navigate('Connexion')} couleur={COLORS.compte} />
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const LIENS = [
    { titre: 'Mes billets', ecran: 'MesBillets' },
    { titre: 'Mes achats musique', ecran: 'MesAchatsMusique' },
    { titre: 'Mes commandes Boutique', ecran: 'MesCommandes' },
    { titre: 'Mon Wallet', ecran: 'Portefeuille' },
    { titre: 'Historique de mes votes', ecran: 'HistoriqueVotes' },
    { titre: "Historique d'ecoute", ecran: 'HistoriqueEcoute' },
    { titre: 'Mes badges de fidelite', ecran: 'Badges' },
    { titre: 'Mes favoris', ecran: 'Favoris' },
    { titre: 'Parametres', ecran: 'Parametres' },
  ];

  return (
    <ImageBackground source={require('../../../assets/images/scene_hub.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <EnteteLogo />
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: HAUTEUR_BARRE_ONGLETS + 20 }}>
          <View style={{ alignItems: 'center' }}>
            {utilisateur?.photoUrl ? (
              <Image source={{ uri: resoudreUrlImage(utilisateur.photoUrl) }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarTexte}>{utilisateur?.nomComplet?.[0] || '?'}</Text>
              </View>
            )}
            <Text style={styles.nom}>{utilisateur?.nomComplet || 'Utilisateur'}</Text>
            <Text style={styles.emailProfil}>{utilisateur?.email}</Text>
          </View>

          <View style={{ marginTop: 24 }}>
            {LIENS.map((l) => (
              <Pressable key={l.titre} style={styles.ligne} onPress={() => navigation.navigate(l.ecran)}>
                <Text style={styles.ligneTexte}>{l.titre}</Text>
                <ChevronRight color={COLORS.texteAtténué} size={18} />
              </Pressable>
            ))}
          </View>

          <View style={{ marginTop: 24 }}>
            <PrimaryButton titre="Se deconnecter" onPress={deconnecter} couleur="#EF4444" />
          </View>
        </ScrollView>
        <BottomTabBar navigation={navigation} variante="compte" ongletActif="profil" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.7)' },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  titre: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 10 },
  sousTitre: { color: COLORS.texteAtténué, textAlign: 'center', marginBottom: 20 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.compte, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarTexte: { color: '#fff', fontSize: 28, fontWeight: '800' },
  nom: { color: '#fff', fontSize: 20, fontWeight: '700' },
  emailProfil: { color: COLORS.texteAtténué, marginTop: 4 },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)' },
  ligneTexte: { color: '#fff', fontSize: 15 },
});
