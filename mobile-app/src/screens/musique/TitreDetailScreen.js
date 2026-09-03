import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download, Check, Trash2 } from 'lucide-react-native';
import client from '../../api/client';
import PrimaryButton from '../../components/PrimaryButton';
import MessageErreur from '../../components/MessageErreur';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import * as HorsLigne from '../../services/telechargementsHorsLigne';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import EnteteLogo from '../../components/EnteteLogo';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

/**
 * Regle de gestion (section 5.2) : un paiement echoue n'emet aucun titre ;
 * on initie le paiement puis on interroge le statut de la transaction
 * jusqu'a confirmation (en mode simulation, la confirmation est immediate).
 * Le mode hors ligne (telechargement local) n'est propose que pour les
 * titres gratuits ou deja achetes.
 */
export default function TitreDetailScreen({ navigation, route }) {
  const { id } = route.params;
  const { estConnecte } = useAuth();
  const [titre, setTitre] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [achatEnCours, setAchatEnCours] = useState(false);
  const [dejaAchete, setDejaAchete] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [message, setMessage] = useState(null);
  const [dejaTelecharge, setDejaTelecharge] = useState(false);
  const [telechargementEnCours, setTelechargementEnCours] = useState(false);
  const [progression, setProgression] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await client.get(`/api/musique/titres/${id}`);
      setTitre(data);
      setChargement(false);
      setDejaTelecharge(await HorsLigne.estTelecharge(id));

      if (estConnecte && !data.gratuit) {
        try {
          const { data: achats } = await client.get('/api/musique/mes-achats');
          setDejaAchete(achats.some((a) => a.titreId === id));
        } catch {}
      }
    })();
  }, [id, estConnecte]);

  const ecouter = () => {
    navigation.navigate('Lecteur', { id });
  };

  const acheter = async () => {
    if (!estConnecte) {
      navigation.navigate('Connexion', { returnTo: 'TitreDetail', returnToParams: { id } });
      return;
    }
    setErreur(null);
    setAchatEnCours(true);
    try {
      await client.post('/api/musique/achats/initier', { titreId: id, moyenPaiement: 'MTN_MOMO' });
      setMessage('Paiement confirme : le titre est maintenant disponible dans "Mes achats".');
      setDejaAchete(true);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setAchatEnCours(false);
    }
  };

  const telechargerHorsLigne = async () => {
    setErreur(null);
    setTelechargementEnCours(true);
    try {
      await HorsLigne.telecharger(titre, setProgression);
      setDejaTelecharge(true);
    } catch (e) {
      setErreur("Echec du telechargement : " + e.message);
    } finally {
      setTelechargementEnCours(false);
      setProgression(0);
    }
  };

  const supprimerHorsLigne = async () => {
    await HorsLigne.supprimerTelechargement(id);
    setDejaTelecharge(false);
  };

  if (chargement) return <ActivityIndicator color={COLORS.musique} style={{ marginTop: 40 }} />;
  if (!titre) return null;

  const peutTelecharger = titre.gratuit || dejaAchete;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <EnteteLogo />
      <View style={{ padding: 20 }}>
        {titre.imageUrl ? (
          <Image source={{ uri: resoudreUrlImage(titre.imageUrl) }} style={styles.pochette} />
        ) : (
          <IconePlaceholder style={styles.pochette} />
        )}
        <Text style={styles.titre}>{titre.nom}</Text>
        <Text style={styles.artiste}>{titre.artiste}</Text>
        <Text style={styles.meta}>{titre.compteurEcoutes} ecoutes · {titre.compteurTelechargements} telechargements</Text>

        <MessageErreur message={erreur} />
        {message && <Text style={styles.message}>{message}</Text>}

        <PrimaryButton titre="Ecouter" onPress={ecouter} couleur={COLORS.musique} />

        {!titre.gratuit && !dejaAchete && (
          <PrimaryButton
            titre={`Acheter  ·  ${titre.prixFcfa} FCFA`}
            onPress={acheter}
            couleur={COLORS.billetterie}
            chargement={achatEnCours}
          />
        )}

        {peutTelecharger && (
          <View style={styles.carteHorsLigne}>
            {dejaTelecharge ? (
              <View style={styles.ligneHorsLigne}>
                <View style={styles.ligneGauche}>
                  <Check color={COLORS.musique} size={18} />
                  <Text style={styles.texteHorsLigne}>Disponible hors ligne</Text>
                </View>
                <Trash2 color={COLORS.texteAtténué} size={18} onPress={supprimerHorsLigne} />
              </View>
            ) : (
              <View style={styles.ligneHorsLigne}>
                <View style={styles.ligneGauche}>
                  <Download color={COLORS.texteAtténué} size={18} />
                  <Text style={styles.texteHorsLigne}>
                    {telechargementEnCours ? `Telechargement... ${Math.round(progression * 100)}%` : 'Telecharger pour ecoute hors ligne'}
                  </Text>
                </View>
                {!telechargementEnCours && (
                  <Text style={styles.lienTelecharger} onPress={telechargerHorsLigne}>Telecharger</Text>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    <BottomTabBar navigation={navigation} variante="musique" ongletActif="rubrique" />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  pochette: { width: '100%', height: 220, borderRadius: 14, marginBottom: 18 },
  titre: { color: '#fff', fontSize: 24, fontWeight: '800' },
  artiste: { color: COLORS.texteAtténué, fontSize: 16, marginTop: 4 },
  meta: { color: COLORS.texteAtténué, fontSize: 12, marginTop: 10, marginBottom: 20 },
  message: { color: COLORS.musique, marginBottom: 10 },
  carteHorsLigne: { backgroundColor: COLORS.fondCarte, borderRadius: 12, padding: 14, marginTop: 14 },
  ligneHorsLigne: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ligneGauche: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  texteHorsLigne: { color: '#fff', fontSize: 13 },
  lienTelecharger: { color: COLORS.musique, fontWeight: '700', fontSize: 13 },
});
