import React, { useMemo, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import FondAuth from '../../components/FondAuth';
import ChampAuth from '../../components/ChampAuth';
import BoutonDegrade from '../../components/BoutonDegrade';
import MessageErreur from '../../components/MessageErreur';
import { useAuth } from '../../context/AuthContext';

function evaluerForce(motDePasse) {
  if (motDePasse.length >= 10) return { niveau: 3, label: 'Fort', couleur: '#22C55E' };
  if (motDePasse.length >= 6) return { niveau: 2, label: 'Moyen', couleur: '#F59E0B' };
  if (motDePasse.length > 0) return { niveau: 1, label: 'Faible', couleur: '#EF4444' };
  return { niveau: 0, label: '', couleur: 'rgba(255,255,255,0.1)' };
}

export default function ReinitialiserMotDePasseScreen({ navigation, route }) {
  const { reinitialiserMotDePasse } = useAuth();
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [erreur, setErreur] = useState(null);
  const [chargement, setChargement] = useState(false);

  const force = useMemo(() => evaluerForce(nouveauMotDePasse), [nouveauMotDePasse]);

  const valider = async () => {
    if (nouveauMotDePasse !== confirmation) {
      setErreur('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setErreur(null);
    setChargement(true);
    try {
      await reinitialiserMotDePasse(email, code, nouveauMotDePasse);
      navigation.navigate('Connexion');
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <FondAuth navigation={navigation}>
      <Text style={styles.titre}>Nouveau mot de passe</Text>
      <Text style={styles.sousTitre}>Creez un nouveau mot de passe securise pour votre compte.</Text>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.label}>Code de verification</Text>
        <ChampAuth valeur={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} placeholder="123456" />
      </View>

      <View style={{ marginTop: 14 }}>
        <Text style={styles.label}>Nouveau mot de passe</Text>
        <ChampAuth valeur={nouveauMotDePasse} onChangeText={setNouveauMotDePasse} motDePasse placeholder="********" />
        {force.niveau > 0 && (
          <View style={styles.forceLigne}>
            <View style={styles.forceRail}>
              <View style={[styles.forceBarre, { width: `${(force.niveau / 3) * 100}%`, backgroundColor: force.couleur }]} />
            </View>
            <Text style={[styles.forceTexte, { color: force.couleur }]}>{force.label}</Text>
          </View>
        )}
      </View>

      <View style={{ marginTop: 14 }}>
        <Text style={styles.label}>Confirmer le mot de passe</Text>
        <ChampAuth valeur={confirmation} onChangeText={setConfirmation} motDePasse placeholder="********" />
      </View>

      <MessageErreur message={erreur} />
      <View style={{ marginTop: 8 }}>
        <BoutonDegrade titre="Reinitialiser le mot de passe" onPress={valider} chargement={chargement} avecFleche={false} />
      </View>

      <View style={styles.illustration}>
        <View style={styles.cercleIcone}><ShieldCheck color="#8B5CF6" size={34} /></View>
      </View>
    </FondAuth>
  );
}

const styles = StyleSheet.create({
  titre: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 10, marginBottom: 6, textAlign: 'center' },
  sousTitre: { color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', paddingHorizontal: 10 },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 6 },
  forceLigne: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  forceRail: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  forceBarre: { height: '100%', borderRadius: 2 },
  forceTexte: { fontSize: 11, fontWeight: '700' },
  illustration: { alignItems: 'center', marginTop: 30 },
  cercleIcone: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(139,92,246,0.12)', alignItems: 'center', justifyContent: 'center' },
});
