import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Music, Radio, ShoppingBag, User } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

/**
 * Barre de navigation fixe en bas de l'ecran, IDENTIQUE dans toute
 * l'application (memes 5 onglets, meme couleur d'accent unique -- le jaune
 * du logo). Corrige un probleme releve par l'audit UX : la version
 * precedente changeait d'onglets ET de couleur selon la rubrique (ex.
 * "Favoris" dans Media renvoyait vers un menu de type Profil), ce qui
 * cassait la coherence et la confiance de l'utilisateur dans l'app. Le
 * parametre "variante" est conserve uniquement pour ne pas casser les
 * appels existants (nombreux ecrans), mais n'est plus utilise : un seul
 * jeu d'onglets universel s'applique desormais partout.
 */
const ONGLETS_UNIVERSELS = [
  { cle: 'accueil', ecran: 'Hub', titre: 'Accueil', Icone: Home },
  { cle: 'musique', ecran: 'MusiqueHome', titre: 'Musique', Icone: Music },
  { cle: 'live', ecran: 'Livestream', titre: 'Live', Icone: Radio },
  { cle: 'boutique', ecran: 'BoutiqueHome', titre: 'Boutique', Icone: ShoppingBag },
  { cle: 'profil', ecran: 'Profil', titre: 'Profil', Icone: User },
];

export default function BottomTabBar({ navigation, ongletActif, ongletActifParams }) {
  const insets = useSafeAreaInsets();
  const couleur = COLORS.or; // couleur d'accent unique de toute l'application

  return (
    <View style={[styles.conteneur, { paddingBottom: insets.bottom || 4 }]}>
      {ONGLETS_UNIVERSELS.map((o) => {
        const actif = o.cle === ongletActif;
        return (
          <Pressable
            key={o.cle}
            style={styles.onglet}
            onPress={() => { if (!actif) navigation.navigate(o.ecran, ongletActifParams); }}
          >
            <o.Icone color={actif ? couleur : COLORS.texteAtténué} size={22} strokeWidth={actif ? 2.4 : 2} />
            <Text style={[styles.libelle, actif && { color: couleur }]}>{o.titre}</Text>
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
