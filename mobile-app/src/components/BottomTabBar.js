import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, Heart, User, Ticket, Radio, TrendingUp, History, ShoppingBag, ShoppingCart, MessageCircle, Music, Settings, Newspaper } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

/**
 * Barre de navigation fixe en bas de l'ecran, CONTEXTUELLE par rubrique
 * (fidele a la maquette de reference : chaque section a ses propres onglets
 * et sa propre couleur d'accent, plutot qu'une seule barre universelle).
 * Navigue dans le meme Stack que le reste de l'app (pas un Tab.Navigator
 * independant) : chaque onglet fait un navigation.navigate() classique.
 */
const VARIANTES = {
  hub: {
    couleur: COLORS.or,
    onglets: [
      { cle: 'accueil', ecran: 'Hub', titre: 'Accueil', Icone: Home },
      { cle: 'musique', ecran: 'MusiqueHome', titre: 'Musique', Icone: Music },
      { cle: 'live', ecran: 'EvenementsListe', titre: 'Live', Icone: Radio },
      { cle: 'boutique', ecran: 'BoutiqueHome', titre: 'Boutique', Icone: ShoppingBag },
      { cle: 'profil', ecran: 'Profil', titre: 'Profil', Icone: User },
    ],
  },
  media: {
    couleur: COLORS.media,
    onglets: [
      { cle: 'accueil', ecran: 'Hub', titre: 'Accueil', Icone: Home },
      { cle: 'rubrique', ecran: 'MediaHome', titre: 'Media', Icone: Newspaper },
      { cle: 'favoris', ecran: 'Favoris', titre: 'Favoris', Icone: Heart },
      { cle: 'profil', ecran: 'Profil', titre: 'Profil', Icone: User },
    ],
  },
  musique: {
    couleur: COLORS.musique,
    onglets: [
      { cle: 'accueil', ecran: 'Hub', titre: 'Accueil', Icone: Home },
      { cle: 'rubrique', ecran: 'MusiqueHome', titre: 'Musique', Icone: Music },
      { cle: 'favoris', ecran: 'Favoris', titre: 'Favoris', Icone: Heart },
      { cle: 'profil', ecran: 'Profil', titre: 'Profil', Icone: User },
    ],
  },
  live: {
    couleur: COLORS.billetterie,
    onglets: [
      { cle: 'accueil', ecran: 'Hub', titre: 'Accueil', Icone: Home },
      { cle: 'billets', ecran: 'MesBillets', titre: 'Billets', Icone: Ticket },
      { cle: 'live', ecran: 'EvenementsListe', titre: 'Live', Icone: Radio },
      { cle: 'profil', ecran: 'Profil', titre: 'Profil', Icone: User },
    ],
  },
  votes: {
    couleur: COLORS.votes,
    onglets: [
      { cle: 'accueil', ecran: 'Hub', titre: 'Accueil', Icone: Home },
      { cle: 'votes', ecran: 'CompetitionsListe', titre: 'Votes', Icone: TrendingUp },
      { cle: 'historique', ecran: 'HistoriqueVotes', titre: 'Historique', Icone: History },
      { cle: 'profil', ecran: 'Profil', titre: 'Profil', Icone: User },
    ],
  },
  boutique: {
    couleur: COLORS.boutique,
    onglets: [
      { cle: 'accueil', ecran: 'Hub', titre: 'Accueil', Icone: Home },
      { cle: 'rubrique', ecran: 'BoutiqueHome', titre: 'Boutique', Icone: ShoppingBag },
      { cle: 'panier', ecran: 'Panier', titre: 'Panier', Icone: ShoppingCart },
      { cle: 'profil', ecran: 'Profil', titre: 'Profil', Icone: User },
    ],
  },
  chatLive: {
    couleur: COLORS.live,
    onglets: [
      { cle: 'accueil', ecran: 'Hub', titre: 'Accueil', Icone: Home },
      { cle: 'live', ecran: 'EvenementsListe', titre: 'Live', Icone: Radio },
      { cle: 'chat', ecran: 'ChatLive', titre: 'Chat', Icone: MessageCircle },
      { cle: 'profil', ecran: 'Profil', titre: 'Profil', Icone: User },
    ],
  },
  compte: {
    couleur: COLORS.compte,
    onglets: [
      { cle: 'accueil', ecran: 'Hub', titre: 'Accueil', Icone: Home },
      { cle: 'wallet', ecran: 'Portefeuille', titre: 'Wallet', Icone: ShoppingCart },
      { cle: 'parametres', ecran: 'Parametres', titre: 'Parametres', Icone: Settings },
      { cle: 'profil', ecran: 'Profil', titre: 'Profil', Icone: User },
    ],
  },
};

export default function BottomTabBar({ navigation, variante = 'media', ongletActif, ongletActifParams }) {
  const insets = useSafeAreaInsets();
  const config = VARIANTES[variante] || VARIANTES.media;

  return (
    <View style={[styles.conteneur, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {config.onglets.map((o) => {
        const actif = o.cle === ongletActif;
        return (
          <Pressable
            key={o.cle}
            style={styles.onglet}
            onPress={() => { if (!actif) navigation.navigate(o.ecran, ongletActifParams); }}
          >
            <o.Icone color={actif ? config.couleur : COLORS.texteAtténué} size={22} strokeWidth={actif ? 2.4 : 2} />
            <Text style={[styles.libelle, actif && { color: config.couleur }]}>{o.titre}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Hauteur reservee en bas de la ScrollView de chaque ecran pour que le contenu ne passe pas sous la barre. */
export const HAUTEUR_BARRE_ONGLETS = 78;

const styles = StyleSheet.create({
  conteneur: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.fondCarte,
    borderTopWidth: 1,
    borderTopColor: COLORS.bordure,
    paddingTop: 10,
  },
  onglet: { flex: 1, alignItems: 'center', gap: 3 },
  libelle: { color: COLORS.texteAtténué, fontSize: 10, fontWeight: '600' },
});
