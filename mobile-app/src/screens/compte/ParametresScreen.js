import React, { useState } from 'react';
import { Text, StyleSheet, View, Pressable, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import EcranCentre from '../../components/EcranCentre';
import BottomTabBar from '../../components/BottomTabBar';
import TextField from '../../components/TextField';
import PrimaryButton from '../../components/PrimaryButton';
import MessageErreur from '../../components/MessageErreur';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { construireFormDataPhoto } from '../../utils/uploadPhoto';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';

/**
 * Parametres du compte (section 9.2) : modification du profil, de la photo
 * et du mot de passe.
 */
export default function ParametresScreen({ navigation }) {
  const { utilisateur, rafraichirProfil } = useAuth();
  const [nomComplet, setNomComplet] = useState(utilisateur?.nomComplet || '');
  const [email, setEmail] = useState(utilisateur?.email || '');
  const [erreurProfil, setErreurProfil] = useState(null);
  const [messageProfil, setMessageProfil] = useState(null);
  const [chargementProfil, setChargementProfil] = useState(false);

  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');
  const [erreurMotDePasse, setErreurMotDePasse] = useState(null);
  const [messageMotDePasse, setMessageMotDePasse] = useState(null);
  const [chargementMotDePasse, setChargementMotDePasse] = useState(false);

  const [chargementPhoto, setChargementPhoto] = useState(false);
  const [erreurPhoto, setErreurPhoto] = useState(null);

  const enregistrerProfil = async () => {
    setErreurProfil(null);
    setChargementProfil(true);
    try {
      await client.put('/api/compte/moi', { nomComplet, email });
      await rafraichirProfil();
      setMessageProfil('Profil mis a jour.');
    } catch (e) {
      setErreurProfil(e.message);
    } finally {
      setChargementProfil(false);
    }
  };

  const changerMotDePasse = async () => {
    setErreurMotDePasse(null);
    setMessageMotDePasse(null);
    if (nouveauMotDePasse.length < 6) {
      setErreurMotDePasse('Le nouveau mot de passe doit contenir au moins 6 caracteres.');
      return;
    }
    if (nouveauMotDePasse !== confirmationMotDePasse) {
      setErreurMotDePasse('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }
    setChargementMotDePasse(true);
    try {
      await client.post('/api/compte/moi/changer-mot-de-passe', { ancienMotDePasse, nouveauMotDePasse });
      setMessageMotDePasse('Mot de passe modifie avec succes.');
      setAncienMotDePasse('');
      setNouveauMotDePasse('');
      setConfirmationMotDePasse('');
    } catch (e) {
      setErreurMotDePasse(e.message);
    } finally {
      setChargementMotDePasse(false);
    }
  };

  const modifierPhoto = async () => {
    setErreurPhoto(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErreurPhoto("Acces a la galerie refuse. Autorisez l'acces dans les reglages du telephone.");
      return;
    }
    const resultat = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (resultat.canceled) return;

    const image = resultat.assets[0];
    const formData = await construireFormDataPhoto(image);

    setChargementPhoto(true);
    try {
      await client.post('/api/compte/moi/photo', formData);
      await rafraichirProfil();
    } catch (e) {
      setErreurPhoto(e.message);
    } finally {
      setChargementPhoto(false);
    }
  };

  return (
    <EcranCentre piedDePage={<BottomTabBar navigation={navigation} variante="compte" ongletActif="parametres" />}>
      <Text style={styles.titre}>Parametres</Text>

      <View style={styles.section}>
        <Pressable onPress={modifierPhoto} style={styles.photoConteneur} disabled={chargementPhoto}>
          {utilisateur?.photoUrl ? (
            <Image source={{ uri: resoudreUrlImage(utilisateur.photoUrl) }} style={styles.photo} />
          ) : (
            <IconePlaceholder style={styles.photo} tailleIcone="65%" />
          )}
          <View style={styles.badgeCamera}>
            <Camera color="#fff" size={14} />
          </View>
        </Pressable>
        <Text style={styles.libellePhoto}>{chargementPhoto ? 'Envoi en cours...' : 'Modifier la photo de profil'}</Text>
        <MessageErreur message={erreurPhoto} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sousTitre}>Informations personnelles</Text>
        <TextField label="Nom complet" value={nomComplet} onChangeText={setNomComplet} />
        <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <MessageErreur message={erreurProfil} />
        {messageProfil && <Text style={styles.message}>{messageProfil}</Text>}
        <PrimaryButton titre="Enregistrer" onPress={enregistrerProfil} couleur={COLORS.compte} chargement={chargementProfil} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sousTitre}>Changer le mot de passe</Text>
        <TextField label="Mot de passe actuel" value={ancienMotDePasse} onChangeText={setAncienMotDePasse} secureTextEntry />
        <TextField label="Nouveau mot de passe" value={nouveauMotDePasse} onChangeText={setNouveauMotDePasse} secureTextEntry />
        <TextField label="Confirmer le nouveau mot de passe" value={confirmationMotDePasse} onChangeText={setConfirmationMotDePasse} secureTextEntry />
        <MessageErreur message={erreurMotDePasse} />
        {messageMotDePasse && <Text style={styles.message}>{messageMotDePasse}</Text>}
        <PrimaryButton titre="Modifier le mot de passe" onPress={changerMotDePasse} couleur={COLORS.compte} chargement={chargementMotDePasse} />
      </View>
    </EcranCentre>
  );
}

const styles = StyleSheet.create({
  titre: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 20 },
  section: { marginBottom: 28 },
  sousTitre: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  message: { color: COLORS.compte, marginBottom: 10 },
  photoConteneur: { alignSelf: 'center', marginBottom: 10 },
  photo: { width: 90, height: 90, borderRadius: 45 },
  photoPlaceholder: { backgroundColor: COLORS.compte, alignItems: 'center', justifyContent: 'center' },
  photoInitiale: { color: '#fff', fontSize: 32, fontWeight: '800' },
  badgeCamera: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.or, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.fond },
  libellePhoto: { color: COLORS.texteAtténué, fontSize: 12, textAlign: 'center' },
});
