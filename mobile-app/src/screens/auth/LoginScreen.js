import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Chrome, Facebook, Apple } from 'lucide-react-native';
import FondAuth from '../../components/FondAuth';
import Logo from '../../components/Logo';
import ChampAuth from '../../components/ChampAuth';
import BoutonDegrade from '../../components/BoutonDegrade';
import BadgeSecurite from '../../components/BadgeSecurite';
import MessageErreur from '../../components/MessageErreur';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';

/** Ecran de connexion (section 3.2) : email + mot de passe, design aligne sur la maquette. */
export default function LoginScreen({ navigation, route }) {
  const { connecter } = useAuth();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  const seConnecter = async () => {
    setErreur(null);
    setChargement(true);
    try {
      await connecter(email.trim(), motDePasse);
      if (route.params?.returnTo) {
        navigation.replace(route.params.returnTo, route.params.returnToParams);
      } else {
        navigation.goBack();
      }
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <FondAuth navigation={navigation} afficherRetour={false}>
      <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 24 }}>
        <Logo taille={46} />
        <Text style={styles.accroche}>Vivez. Écoutez. Participez.</Text>
        <Text style={styles.slogan}>Tout votre univers, au même endroit.</Text>
      </View>

      <Text style={styles.titre}>Connexion</Text>
      <Text style={styles.sousTitre}>Entrez votre email pour accéder à tous nos services.</Text>

      <Text style={styles.label}>Email</Text>
      <ChampAuth
        valeur={email}
        onChangeText={setEmail}
        placeholder="vous@exemple.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={{ marginTop: 14 }}>
        <Text style={styles.label}>Mot de passe</Text>
        <ChampAuth valeur={motDePasse} onChangeText={setMotDePasse} motDePasse placeholder="********" />
      </View>

      <MessageErreur message={erreur} />

      <BoutonDegrade titre="Continuer" onPress={seConnecter} chargement={chargement} />

      <View style={styles.separateurLigne}>
        <View style={styles.trait} />
        <Text style={styles.separateurTexte}>ou continuer avec</Text>
        <View style={styles.trait} />
      </View>

      <View style={styles.reseaux}>
        <View style={styles.boutonReseau}><Chrome color="#fff" size={18} /><Text style={styles.reseauTexte}>Google</Text></View>
        <View style={styles.boutonReseau}><Facebook color="#fff" size={18} /><Text style={styles.reseauTexte}>Facebook</Text></View>
        <View style={styles.boutonReseau}><Apple color="#fff" size={18} /><Text style={styles.reseauTexte}>Apple</Text></View>
      </View>

      <BadgeSecurite />

      <Pressable onPress={() => navigation.navigate('MotDePasseOublie')}>
        <Text style={styles.lienMotDePasseOublie}>Mot de passe oublié ?</Text>
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Inscription', route.params)} style={{ marginTop: 4 }}>
        <Text style={styles.lienBas}>Vous n'avez pas de compte ? <Text style={styles.lienBasAccent}>Inscrivez-vous</Text></Text>
      </Pressable>
    </FondAuth>
  );
}

const styles = StyleSheet.create({
  accroche: { color: '#fff', fontSize: 13, marginTop: 12, fontWeight: '600' },
  slogan: { color: COLORS.or, fontSize: 11, marginTop: 2 },
  titre: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  sousTitre: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginBottom: 22, paddingHorizontal: 10 },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6 },
  separateurLigne: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  trait: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  separateurTexte: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginHorizontal: 10 },
  reseaux: { flexDirection: 'row', gap: 10 },
  boutonReseau: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  reseauTexte: { color: '#fff', fontSize: 12 },
  lien: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 18, fontSize: 13 },
  lienMotDePasseOublie: { color: COLORS.or, textAlign: 'center', marginTop: 18, fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  lienBas: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 10, fontSize: 13 },
  lienBasAccent: { color: COLORS.or, fontWeight: '700' },
});
