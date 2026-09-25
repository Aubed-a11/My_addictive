import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function TextField({ label, ...props }) {
  return (
    <View style={styles.conteneur}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={COLORS.texteAtténué}
        style={styles.champ}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { marginBottom: 14 },
  label: { color: COLORS.texteAtténué, marginBottom: 6, fontSize: 13 },
  champ: {
    backgroundColor: COLORS.fondCarte, color: COLORS.texte, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.bordure, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16,
  },
});
