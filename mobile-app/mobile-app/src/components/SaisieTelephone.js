import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, FlatList } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { INDICATIFS } from '../theme/auth';
import DrapeauPetit from './DrapeauPetit';
import { COLORS } from '../theme/colors';

/** Champ "numero de telephone" avec selecteur d'indicatif pays (drapeau + code), style maquette. */
export default function SaisieTelephone({ indicatifPays, telephone, onChangeIndicatif, onChangeTelephone }) {
  const [ouvert, setOuvert] = useState(false);
  const selection = INDICATIFS.find((i) => i.code === indicatifPays) || INDICATIFS[0];

  return (
    <View>
      <View style={styles.conteneur}>
        <Pressable style={styles.selecteur} onPress={() => setOuvert(true)}>
          <DrapeauPetit couleurs={selection.drapeau} />
          <Text style={styles.code}>{selection.code}</Text>
          <ChevronDown color={COLORS.texteAtténué} size={16} />
        </Pressable>
        <View style={styles.separateur} />
        <TextInput
          style={styles.champ}
          value={telephone}
          onChangeText={onChangeTelephone}
          keyboardType="phone-pad"
          placeholder="01 23 45 67 89"
          placeholderTextColor={COLORS.texteAtténué}
        />
      </View>

      <Modal visible={ouvert} transparent animationType="fade" onRequestClose={() => setOuvert(false)}>
        <Pressable style={styles.fondModal} onPress={() => setOuvert(false)}>
          <View style={styles.listeModal}>
            <FlatList
              data={INDICATIFS}
              keyExtractor={(i) => i.code}
              renderItem={({ item }) => (
                <Pressable style={styles.optionModal} onPress={() => { onChangeIndicatif(item.code); setOuvert(false); }}>
                  <DrapeauPetit couleurs={item.drapeau} taille={22} />
                  <Text style={styles.optionTexte}>{item.pays}</Text>
                  <Text style={styles.optionCode}>{item.code}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)', height: 56,
  },
  selecteur: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 6 },
  code: { color: '#fff', fontSize: 15, marginHorizontal: 4 },
  separateur: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  champ: { flex: 1, color: '#fff', fontSize: 15, paddingHorizontal: 14, height: '100%' },
  fondModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 30 },
  listeModal: { backgroundColor: '#1A1028', borderRadius: 16, maxHeight: 320, paddingVertical: 8 },
  optionModal: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  optionTexte: { color: '#fff', fontSize: 14, flex: 1 },
  optionCode: { color: COLORS.texteAtténué, fontSize: 13 },
});
