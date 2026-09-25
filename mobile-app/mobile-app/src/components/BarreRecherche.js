import React from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

/**
 * Barre de recherche repliable : une icone loupe qui, au clic, revele un
 * champ de saisie filtrant la liste affichee. Recherche cote app (sur les
 * elements deja charges), pas d'appel serveur dedie pour l'instant.
 */
export default function BarreRecherche({ valeur, onChangeText, placeholder = 'Rechercher...', couleurAccent = COLORS.or, ouverte, onToggle }) {
  if (!ouverte) {
    return (
      <Pressable onPress={onToggle} style={styles.boutonFerme} hitSlop={10}>
        <Search color="#fff" size={20} />
      </Pressable>
    );
  }

  return (
    <View style={[styles.champConteneur, { borderColor: couleurAccent }]}>
      <Search color={couleurAccent} size={16} />
      <TextInput
        value={valeur}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.texteAtténué}
        style={styles.champ}
        autoFocus
      />
      <Pressable onPress={() => { onChangeText(''); onToggle(); }} hitSlop={10}>
        <X color={COLORS.texteAtténué} size={18} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  boutonFerme: { padding: 4 },
  champConteneur: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.fondCarte, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  champ: { flex: 1, color: '#fff', fontSize: 14, padding: 0 },
});
