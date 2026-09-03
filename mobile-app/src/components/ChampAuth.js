import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

/** Champ de saisie style pilule sombre (email, mot de passe...). */
export default function ChampAuth({ valeur, onChangeText, motDePasse = false, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.conteneur}>
      <TextInput
        style={styles.champ}
        value={valeur}
        onChangeText={onChangeText}
        placeholderTextColor={COLORS.texteAtténué}
        secureTextEntry={motDePasse && !visible}
        {...props}
      />
      {motDePasse && (
        <Pressable onPress={() => setVisible(!visible)} style={styles.icone}>
          {visible ? <EyeOff color={COLORS.texteAtténué} size={18} /> : <Eye color={COLORS.texteAtténué} size={18} />}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)', height: 56, paddingHorizontal: 14,
  },
  champ: { flex: 1, color: '#fff', fontSize: 15, height: '100%' },
  icone: { padding: 6 },
});
