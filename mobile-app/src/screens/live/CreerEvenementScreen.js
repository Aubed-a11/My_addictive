import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import client from '../../api/client';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import MessageErreur from '../../components/MessageErreur';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import BottomTabBar from '../../components/BottomTabBar';

/**
 * Creation d'evenement en auto-service (section 6.1) : un organisateur peut
 * programmer et diffuser son propre spectacle, sans passer par le
 * back-office. Reserve aux roles ORGANISATEUR et ADMINISTRATEUR.
 */
export default function CreerEvenementScreen({ navigation }) {
  const { estConnecte } = useAuth();
  const [titre, setTitre] = useState('');
  const [lieu, setLieu] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [prixStandard, setPrixStandard] = useState('5000');
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [chargement, setChargement] = useState(false);

  if (!estConnecte) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centre}>
          <Text style={styles.titrePage}>Creer un evenement</Text>
          <Text style={styles.sousTitre}>Organisez et diffusez votre propre spectacle sur My Addictive.</Text>
          <Text style={styles.gate}>Connexion requise</Text>
          <Text style={styles.gateTexte}>Vous devez etre connecte pour creer un evenement.</Text>
          <PrimaryButton titre="Se connecter" onPress={() => navigation.navigate('Connexion', { returnTo: 'CreerEvenement' })} couleur={COLORS.billetterie} />
        </View>
      </SafeAreaView>
    );
  }

  const creer = async () => {
    if (!titre.trim() || !lieu.trim() || !dateDebut.trim()) {
      setErreur('Merci de remplir au moins le titre, le lieu et la date.');
      return;
    }
    setErreur(null);
    setChargement(true);
    try {
      const corps = {
        titre: titre.trim(),
        lieu: lieu.trim(),
        dateDebut: new Date(dateDebut).toISOString(),
        statut: 'A_VENIR',
        payant: true,
        prixStandardFcfa: Number(prixStandard) || 0,
        prixVipFcfa: (Number(prixStandard) || 0) * 3,
      };
      await client.post('/api/live/evenements', corps);
      setMessage('Evenement cree ! Retrouvez-le dans la liste des evenements a venir.');
      setTitre(''); setLieu(''); setDateDebut('');
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={{ padding: 20 }}>
        <Text style={styles.titrePage}>Creer un evenement</Text>
        <Text style={styles.sousTitre}>Organisez et diffusez votre propre spectacle sur My Addictive.</Text>

        <TextField label="Titre de l'evenement" value={titre} onChangeText={setTitre} placeholder="Ex. Nuit Afrobeat" />
        <TextField label="Lieu" value={lieu} onChangeText={setLieu} placeholder="Ex. Palais des Congres, Cotonou" />
        <TextField label="Date et heure (AAAA-MM-JJ HH:MM)" value={dateDebut} onChangeText={setDateDebut} placeholder="2026-12-20 20:00" />
        <TextField label="Prix standard (FCFA)" value={prixStandard} onChangeText={setPrixStandard} keyboardType="number-pad" />

        <MessageErreur message={erreur} />
        {message && <Text style={styles.message}>{message}</Text>}

        <PrimaryButton titre="Creer l'evenement" onPress={creer} couleur={COLORS.billetterie} chargement={chargement} />

        <Text style={styles.note}>
          Reserve aux comptes organisateurs. Si vous obtenez une erreur de permission, contactez l'administration pour faire evoluer votre role.
        </Text>
      </View>
    <BottomTabBar navigation={navigation} variante="live" />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  titrePage: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  sousTitre: { color: COLORS.texteAtténué, fontSize: 13, marginBottom: 20 },
  gate: { color: COLORS.billetterie, fontWeight: '700', fontSize: 16, marginTop: 20 },
  gateTexte: { color: COLORS.texteAtténué, fontSize: 13, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  message: { color: COLORS.billetterie, marginBottom: 10 },
  note: { color: COLORS.texteAtténué, fontSize: 11, textAlign: 'center', marginTop: 16 },
});
