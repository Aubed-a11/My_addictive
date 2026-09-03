import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { CheckCircle2, Clock, MapPin } from 'lucide-react-native';
import client from '../../api/client';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';
import EnteteLogo from '../../components/EnteteLogo';
import BottomTabBar, { HAUTEUR_BARRE_ONGLETS } from '../../components/BottomTabBar';

const LIBELLES_STATUT = {
  VALIDE: { texte: 'Pret pour le scan a l\u2019entree', couleur: COLORS.musique },
  UTILISE: { texte: 'Deja scanne a l\u2019entree', couleur: '#F87171' },
  ANNULE: { texte: 'Billet annule', couleur: COLORS.texteAtténué },
};

/** Billet numerique avec code QR, controle a l'entree par scan (section 6.2). */
export default function MesBilletsScreen({ navigation }) {
  const [billets, setBillets] = useState([]);

  useEffect(() => {
    (async () => {
      const { data } = await client.get('/api/live/billets/mes-billets');
      setBillets(data);
    })();
  }, []);

  const formaterDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <ImageBackground source={require('../../../assets/images/scene_bienvenue.jpg')} style={styles.safe} resizeMode="cover">
      <View style={styles.voile} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <EnteteLogo />
      <Text style={styles.titre}>Mes billets</Text>
      <FlatList
                style={{ flex: 1 }}
        data={billets}
        keyExtractor={(b) => String(b.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const statutInfo = LIBELLES_STATUT[item.statut] || LIBELLES_STATUT.VALIDE;
          return (
            <View style={styles.carte}>
              <View style={styles.entete}>
                {item.evenementImageUrl ? (
                  <Image source={{ uri: resoudreUrlImage(item.evenementImageUrl) }} style={styles.vignette} />
                ) : (
                  <IconePlaceholder style={styles.vignette} tailleIcone="60%" />
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.evenementTitre} numberOfLines={2}>{item.evenementTitre}</Text>
                  <View style={styles.ligneInfo}>
                    <MapPin size={12} color={COLORS.texteAtténué} />
                    <Text style={styles.infoTexte} numberOfLines={1}>{item.evenementLieu}</Text>
                  </View>
                  <View style={styles.ligneInfo}>
                    <Clock size={12} color={COLORS.texteAtténué} />
                    <Text style={styles.infoTexte}>{formaterDate(item.evenementDateDebut)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.qrConteneur}>
                <QRCode value={item.codeQr} size={130} backgroundColor="#fff" />
              </View>

              <View style={styles.pied}>
                <Text style={styles.categorie}>Categorie {item.categorie}</Text>
                <View style={styles.statutLigne}>
                  {item.statut === 'UTILISE' && <CheckCircle2 size={14} color={statutInfo.couleur} />}
                  <Text style={[styles.statutTexte, { color: statutInfo.couleur }]}>{statutInfo.texte}</Text>
                </View>
                {item.statut === 'UTILISE' && item.dateScan && (
                  <Text style={styles.dateScan}>Scanne le {formaterDate(item.dateScan)}</Text>
                )}
              </View>

              <Text style={styles.instruction}>
                Presentez ce code QR a l'entree : un agent le scannera avec l'application organisateur pour valider votre acces. Chaque billet ne peut etre scanne qu'une seule fois.
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.vide}>Vous n'avez pas encore de billet.</Text>}
      />
    <BottomTabBar navigation={navigation} variante="live" ongletActif="billets" />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voile: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.6)' },
  titre: { color: '#fff', fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 4 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40 },
  carte: { backgroundColor: COLORS.fondCarte, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.bordure },
  entete: { flexDirection: 'row', marginBottom: 16 },
  vignette: { width: 56, height: 56, borderRadius: 10 },
  evenementTitre: { color: '#fff', fontWeight: '800', fontSize: 15 },
  ligneInfo: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  infoTexte: { color: COLORS.texteAtténué, fontSize: 12, flexShrink: 1 },
  qrConteneur: { backgroundColor: '#fff', padding: 14, borderRadius: 10, alignSelf: 'center', marginBottom: 14 },
  pied: { alignItems: 'center' },
  categorie: { color: '#fff', fontWeight: '700', fontSize: 13 },
  statutLigne: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  statutTexte: { fontSize: 12, fontWeight: '600' },
  dateScan: { color: COLORS.texteAtténué, fontSize: 11, marginTop: 2 },
  instruction: { color: COLORS.texteAtténué, fontSize: 11, textAlign: 'center', marginTop: 14, lineHeight: 16, paddingHorizontal: 8 },
});
