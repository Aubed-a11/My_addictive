import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import FondAuth from '../../components/FondAuth';
import SaisieOtp from '../../components/SaisieOtp';
import BoutonDegrade from '../../components/BoutonDegrade';
import MessageErreur from '../../components/MessageErreur';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';

export default function VerificationOtpScreen({ navigation, route }) {
  const { verifierOtp } = useAuth();
  const { indicatifPays, telephone, returnTo, returnToParams } = route.params;
  const [code, setCode] = useState('');
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [compteAReboursSecondes, setCompteAReboursSecondes] = useState(60);

  useEffect(() => {
    if (compteAReboursSecondes <= 0) return;
    const minuteur = setTimeout(() => setCompteAReboursSecondes((s) => s - 1), 1000);
    return () => clearTimeout(minuteur);
  }, [compteAReboursSecondes]);

  const verifier = async () => {
    setErreur(null);
    setChargement(true);
    try {
      await verifierOtp(indicatifPays, telephone, code);
      if (returnTo) {
        navigation.replace(returnTo, returnToParams);
      } else {
        navigation.popToTop();
      }
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <FondAuth navigation={navigation}>
      <Text style={styles.titre}>Verification</Text>
      <Text style={styles.sousTitre}>Nous avons envoye un code a {indicatifPays} {telephone}</Text>

      <SaisieOtp valeur={code} onChange={setCode} />

      <Text style={styles.renvoi}>
        {compteAReboursSecondes > 0
          ? `Renvoyer le code dans ${compteAReboursSecondes}s`
          : "Vous n'avez pas recu le code ?"}
      </Text>
      {compteAReboursSecondes <= 0 && (
        <Pressable onPress={() => setCompteAReboursSecondes(60)}>
          <Text style={styles.renvoiLien}>Renvoyer</Text>
        </Pressable>
      )}

      <MessageErreur message={erreur} />
      <BoutonDegrade titre="Verifier" onPress={verifier} chargement={chargement} disabled={code.length < 6} avecFleche={false} />
    </FondAuth>
  );
}

const styles = StyleSheet.create({
  titre: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 10, marginBottom: 6, textAlign: 'center' },
  sousTitre: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', marginBottom: 6, paddingHorizontal: 10 },
  renvoi: { color: COLORS.texteAtténué, fontSize: 12, textAlign: 'center', marginTop: 8 },
  renvoiLien: { color: COLORS.or, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 4 },
});
