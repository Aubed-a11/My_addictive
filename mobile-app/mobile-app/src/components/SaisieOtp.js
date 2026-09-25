import React, { useRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

/** 6 cases de code OTP avec avancement/retour automatique entre les champs. */
export default function SaisieOtp({ valeur, onChange, longueur = 6 }) {
  const refs = useRef([]);
  const chiffres = valeur.split('');

  const surChangement = (texte, index) => {
    const chiffresPropre = texte.replace(/[^0-9]/g, '');
    const nouveauxChiffres = [...chiffres];
    nouveauxChiffres[index] = chiffresPropre.slice(-1) || '';
    const nouvelleValeur = nouveauxChiffres.join('').slice(0, longueur);
    onChange(nouvelleValeur);

    if (chiffresPropre && index < longueur - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const surTouche = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !chiffres[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.ligne}>
      {Array.from({ length: longueur }).map((_, i) => (
        <TextInput
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          style={[styles.case, chiffres[i] && styles.caseRemplie]}
          value={chiffres[i] || ''}
          onChangeText={(t) => surChangement(t, i)}
          onKeyPress={(e) => surTouche(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10 },
  case: {
    width: 46, height: 56, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.4)',
    backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 22, fontWeight: '700',
  },
  caseRemplie: { borderColor: '#EC4899' },
});
