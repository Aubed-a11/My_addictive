import React, { useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { Lock } from 'lucide-react-native';
import FondAuth from '../../components/FondAuth';
import ChampAuth from '../../components/ChampAuth';
import BoutonDegrade from '../../components/BoutonDegrade';
import MessageErreur from '../../components/MessageErreur';
import { useAuth } from '../../context/AuthContext';

export default function MotDePasseOublieScreen({ navigation }) {
  const { demanderReinitialisation } = useAuth();
  const [email, setEmail] = useState('');
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  const envoyerCode = async () => {
    setErreur(null);
    setChargement(true);
    try {
      await demanderReinitialisation(email.trim());
      navigation.navigate('ReinitialiserMotDePasse', { email: email.trim() });
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <FondAuth navigation={navigation}>
      <Text style={styles.titre}>Mot de passe oublie</Text>
      <Text style={styles.sousTitre}>Entrez votre email pour recevoir un code de reinitialisation.</Text>

      <View style={{ marginTop: 20 }}>
        <ChampAuth
          valeur={email}
          onChangeText={setEmail}
          placeholder="vous@exemple.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <MessageErreur message={erreur} />
      <View style={{ marginTop: 8 }}>
        <BoutonDegrade titre="Envoyer le code" onPress={envoyerCode} chargement={chargement} />
      </View>

      <View style={styles.illustration}>
        <View style={styles.cercleIcone}><Lock color="#8B5CF6" size={34} /></View>
        <Text style={styles.texteIllustration}>Reinitialisez votre mot de passe en toute securite</Text>
      </View>
    </FondAuth>
  );
}

const styles = StyleSheet.create({
  titre: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 10, marginBottom: 6, textAlign: 'center' },
  sousTitre: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', paddingHorizontal: 10 },
  illustration: { alignItems: 'center', marginTop: 50 },
  cercleIcone: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  texteIllustration: { color: 'rgba(255,255,255,0.5)', fontSize: 12, textAlign: 'center', paddingHorizontal: 30 },
});
