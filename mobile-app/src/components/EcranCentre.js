import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

/** Enveloppe standard des ecrans : fond sombre, zone securisee, defilement. */
export default function EcranCentre({ children, style, piedDePage }) {
  return (
    <SafeAreaView style={[styles.safe, style]}>
      <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {piedDePage}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  contenu: { padding: 20, paddingBottom: 40 },
});
