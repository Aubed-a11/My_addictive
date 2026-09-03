import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import EcranCentre from '../../components/EcranCentre';
import BottomTabBar from '../../components/BottomTabBar';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import MessageErreur from '../../components/MessageErreur';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';

/** Formulaire de demande d'ouverture de boutique (section 8.1), ouvert a tout commercant. */
export default function InscriptionVendeurScreen({ navigation }) {
  const { estConnecte } = useAuth();
  const [nomBoutique, setNomBoutique] = useState('');
  const [categorie, setCategorie] = useState('MODE');
  const [description, setDescription] = useState('');
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [chargement, setChargement] = useState(false);

  const soumettre = async () => {
    if (!estConnecte) { navigation.navigate('Connexion'); return; }
    setErreur(null);
    setChargement(true);
    try {
      await client.post('/api/boutique/vendeurs/inscription', { nomBoutique, categorie, description });
      setMessage('Demande envoyee. Votre boutique sera visible apres validation par l\'administration.');
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <EcranCentre piedDePage={<BottomTabBar navigation={navigation} variante="boutique" />}>
      <Text style={styles.titre}>Ouvrir ma boutique</Text>
      <Text style={styles.sousTitre}>Accessible a tout vendeur, artiste ou non.</Text>

      <TextField label="Nom de la boutique" value={nomBoutique} onChangeText={setNomBoutique} />
      <TextField label="Categorie (MODE, HIGH_TECH, MAISON, ...)" value={categorie} onChangeText={setCategorie} />
      <TextField label="Description" value={description} onChangeText={setDescription} multiline />

      <MessageErreur message={erreur} />
      {message && <Text style={styles.message}>{message}</Text>}

      <PrimaryButton titre="Envoyer la demande" onPress={soumettre} couleur={COLORS.boutique} chargement={chargement} />
    </EcranCentre>
  );
}

const styles = StyleSheet.create({
  titre: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 6 },
  sousTitre: { color: COLORS.texteAtténué, marginBottom: 20 },
  message: { color: COLORS.boutique, marginBottom: 10 },
});
