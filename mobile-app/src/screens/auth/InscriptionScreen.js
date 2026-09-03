import React, { useState } from 'react';
import { Text, StyleSheet, View, Pressable, Image, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import FondAuth from '../../components/FondAuth';
import ChampAuth from '../../components/ChampAuth';
import BoutonDegrade from '../../components/BoutonDegrade';
import MessageErreur from '../../components/MessageErreur';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { construireFormDataPhoto } from '../../utils/uploadPhoto';
import { COLORS } from '../../theme/colors';

/** Inscription en une seule etape : email + mot de passe, connecte immediatement (section 3.2). Photo de profil optionnelle. */
export default function InscriptionScreen({ navigation, route }) {
  const { inscrire, rafraichirProfil } = useAuth();
  const [nomComplet, setNomComplet] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');
  const [photo, setPhoto] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  const choisirPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const resultat = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!resultat.canceled) setPhoto(resultat.assets[0]);
  };

  const creerCompte = async () => {
    setErreur(null);
    if (motDePasse.length < 6) {
      setErreur('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (motDePasse !== confirmationMotDePasse) {
      setErreur('La confirmation ne correspond pas au mot de passe.');
      return;
    }
    setChargement(true);
    try {
      await inscrire(email.trim(), motDePasse, nomComplet.trim());

      // La photo s'envoie apres coup : l'inscription cree le compte et
      // connecte immediatement (jeton disponible), necessaire pour uploader
      // sur un endpoint protege. Un echec ici n'empeche pas la creation du
      // compte : l'utilisateur pourra toujours ajouter sa photo plus tard
      // depuis les parametres.
      if (photo) {
        try {
          const formData = await construireFormDataPhoto(photo);
          await client.post('/api/compte/moi/photo', formData);
          await rafraichirProfil();
        } catch (erreurPhoto) {
          console.error('[Inscription] Echec upload photo :', erreurPhoto);
        }
      }

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
    <FondAuth navigation={navigation}>
      <Text style={styles.titre}>Inscription</Text>
      <Text style={styles.sousTitre}>Créer votre compte My Addictive</Text>

      <Pressable onPress={choisirPhoto} style={styles.photoConteneur}>
        {photo ? (
          <Image source={{ uri: photo.uri }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Camera color="rgba(255,255,255,0.6)" size={22} />
          </View>
        )}
        <Text style={styles.libellePhoto}>{photo ? 'Changer la photo' : 'Ajouter une photo (optionnel)'}</Text>
      </Pressable>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.label}>Nom complet</Text>
        <ChampAuth valeur={nomComplet} onChangeText={setNomComplet} placeholder="John Doe" />
      </View>

      <View style={{ marginTop: 14 }}>
        <Text style={styles.label}>Email</Text>
        <ChampAuth
          valeur={email}
          onChangeText={setEmail}
          placeholder="vous@exemple.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={{ marginTop: 14 }}>
        <Text style={styles.label}>Mot de passe</Text>
        <ChampAuth valeur={motDePasse} onChangeText={setMotDePasse} motDePasse placeholder="Au moins 6 caractères" />
      </View>

      <View style={{ marginTop: 14 }}>
        <Text style={styles.label}>Confirmer le mot de passe</Text>
        <ChampAuth valeur={confirmationMotDePasse} onChangeText={setConfirmationMotDePasse} motDePasse placeholder="Ressaisissez le mot de passe" />
      </View>

      <MessageErreur message={erreur} />
      <View style={{ marginTop: 8 }}>
        <BoutonDegrade titre="Creer mon compte" onPress={creerCompte} chargement={chargement} />
      </View>

      <Text style={styles.dejaCompte} onPress={() => navigation.navigate('Connexion')}>
        Déjà un compte ? <Text style={styles.accent}>Connectez-vous</Text>
      </Text>
    </FondAuth>
  );
}

const styles = StyleSheet.create({
  titre: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 10, marginBottom: 6, textAlign: 'center' },
  sousTitre: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center' },
  photoConteneur: { alignItems: 'center', marginTop: 18 },
  photo: { width: 72, height: 72, borderRadius: 36 },
  photoPlaceholder: { backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderStyle: 'dashed' },
  libellePhoto: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 6 },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6 },
  dejaCompte: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 18, fontSize: 13 },
  accent: { color: COLORS.or, fontWeight: '700' },
});
