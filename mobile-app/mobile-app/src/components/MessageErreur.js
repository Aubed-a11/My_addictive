import React from 'react';
import { Text, StyleSheet } from 'react-native';

export default function MessageErreur({ message }) {
  if (!message) return null;
  return <Text style={styles.texte}>{message}</Text>;
}

const styles = StyleSheet.create({
  texte: { color: '#F87171', marginBottom: 10, fontSize: 14 },
});
