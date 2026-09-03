import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, FlatList, ActivityIndicator, ImageBackground, Alert } from 'react-native';
import * as HorsLigne from '../../services/telechargementsHorsLigne';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import {
  ChevronDown, MoreVertical, Heart, Share2, Shuffle, SkipBack, Play, Pause,
  SkipForward, Repeat, Download, ListPlus, Mic2, Clock, X,
} from 'lucide-react-native';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import { resoudreUrlImage, resoudreUrlFichier } from '../../utils/urlImage';
import IconePlaceholder from '../../components/IconePlaceholder';

/**
 * Lecteur plein ecran, fidele a la maquette de reference fournie (theme
 * vert, badge HQ, file d'attente), avec en plus un fond flouté/teinte a
 * partir de la pochette elle-meme (comme les lecteurs Spotify/Apple Music),
 * pour donner de la profondeur meme quand il n'y a pas de vraie pochette
 * (l'icone My Addictive sert alors de cover de secours, mise en valeur par
 * une ombre portee et un halo colore plutot qu'affichee "a plat").
 *
 * Lecture audio reelle (expo-av) branchee pour les titres qui disposent
 * d'un vrai fichier recupere (voir VerificateurFichiersTitres cote
 * musique-service) : seule une petite partie du catalogue legacy est dans
 * ce cas pour l'instant. Pour les autres, le lecteur reste en mode "apercu
 * visuel" explicite (badge et message dedies), plutot que de simuler une
 * lecture qui n'existe pas.
 */
/** Ligne de la file d'attente, avec repli sur l'icone si l'image echoue reellement au chargement (pas seulement si l'URL est absente). */
function LigneFileAttente({ item, navigation }) {
  const [erreur, setErreur] = useState(false);
  return (
    <Pressable style={styles.ligneFile} onPress={() => navigation.replace('Lecteur', { id: item.id })}>
      {item.imageUrl && !erreur ? (
        <Image source={{ uri: resoudreUrlImage(item.imageUrl) }} style={styles.miniPochette} onError={() => setErreur(true)} />
      ) : (
        <View style={styles.miniPochetteFond}>
          <IconePlaceholder style={styles.miniPochette} tailleIcone="55%" />
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.fileLigneTitre} numberOfLines={1}>{item.nom}</Text>
        <Text style={styles.fileLigneArtiste} numberOfLines={1}>{item.artiste}</Text>
      </View>
      <MoreVertical color="rgba(255,255,255,0.5)" size={18} />
    </Pressable>
  );
}

export default function LecteurScreen({ navigation, route }) {
  const { id } = route.params;
  const { estConnecte } = useAuth();
  const [titre, setTitre] = useState(null);
  const [fileAttente, setFileAttente] = useState([]);
  const [enLecture, setEnLecture] = useState(false);
  const [progression, setProgression] = useState(0);
  const [dureeReelleMs, setDureeReelleMs] = useState(0);
  const [positionReelleMs, setPositionReelleMs] = useState(0);
  const [favori, setFavori] = useState(false);
  const [favoriId, setFavoriId] = useState(null);
  const [melangeActif, setMelangeActif] = useState(false);
  const [repeteActif, setRepeteActif] = useState(false);
  const [largeurBarre, setLargeurBarre] = useState(0);
  const [telechargement, setTelechargement] = useState(null); // null | 'en_cours' | 'termine'
  const [minuteurActif, setMinuteurActif] = useState(null); // minutes restantes affichees, ou null
  const [erreurPochette, setErreurPochette] = useState(false);
  const sonRef = React.useRef(null);
  const minuteurRef = React.useRef(null);
  const repeteActifRef = React.useRef(false);
  const allerVersRef = React.useRef(null);

  useEffect(() => { repeteActifRef.current = repeteActif; }, [repeteActif]);

  // Lecture audio reelle (expo-av) uniquement quand le titre dispose d'un
  // vrai fichier audio recupere (voir VerificateurFichiersTitres cote
  // backend) : la grande majorite du catalogue legacy n'a pas encore de
  // fichier reel, auquel cas le lecteur reste en mode visuel seul, sans
  // pretendre lire un son qui n'existe pas.
  useEffect(() => {
    return () => {
      if (sonRef.current) {
        sonRef.current.unloadAsync();
      }
      if (minuteurRef.current) {
        clearTimeout(minuteurRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let annule = false;
    setErreurPochette(false);
    (async () => {
      if (sonRef.current) {
        await sonRef.current.unloadAsync();
        sonRef.current = null;
      }
      setPositionReelleMs(0);
      setDureeReelleMs(0);
      setProgression(0);
      setEnLecture(false);

      if (!titre?.fichierAudioUrl) return;

      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: resoudreUrlFichier(titre.fichierAudioUrl) },
          { shouldPlay: true },
          (statut) => {
            if (annule || !statut.isLoaded) return;
            setPositionReelleMs(statut.positionMillis || 0);
            setDureeReelleMs(statut.durationMillis || 0);
            if (statut.durationMillis) setProgression(statut.positionMillis / statut.durationMillis);
            setEnLecture(statut.isPlaying);
            if (statut.didJustFinish) {
              if (repeteActifRef.current) {
                sonRef.current?.replayAsync();
              } else {
                allerVersRef.current?.('suivant');
              }
            }
          }
        );
        if (annule) {
          sound.unloadAsync();
          return;
        }
        sonRef.current = sound;
        setEnLecture(true);
      } catch {
        // Fichier introuvable ou format non supporte : le lecteur reste en mode visuel.
      }
    })();
    return () => { annule = true; };
  }, [titre?.id]);

  const basculerLecture = async () => {
    if (!sonRef.current) return; // pas de vrai fichier : le bouton n'a rien a controler
    const statut = await sonRef.current.getStatusAsync();
    if (statut.isPlaying) await sonRef.current.pauseAsync();
    else await sonRef.current.playAsync();
  };

  const allerVers = (direction) => {
    if (fileAttente.length === 0) return;
    let prochain;
    if (melangeActif) {
      // Piste aleatoire differente de l'actuelle (tant que la file en compte plus d'une).
      do {
        prochain = fileAttente[Math.floor(Math.random() * fileAttente.length)];
      } while (fileAttente.length > 1 && prochain.id === titre?.id);
    } else {
      const decalage = direction === 'suivant' ? 1 : -1;
      // La file d'attente exclut deja le titre courant : on repart simplement
      // du debut (ou de la fin) de cette liste plutot que de chercher un
      // index du titre actuel qui n'y figure pas.
      const indexBase = direction === 'suivant' ? 0 : fileAttente.length - 1;
      prochain = fileAttente[indexBase];
    }
    if (prochain) navigation.replace('Lecteur', { id: prochain.id });
  };

  useEffect(() => { allerVersRef.current = allerVers; }, [fileAttente, melangeActif, titre?.id]);

  useEffect(() => {
    (async () => {
      const { data } = await client.get(`/api/musique/titres/${id}`);
      setTitre(data);
      client.post(`/api/musique/titres/${id}/ecouter`).catch(() => {});
      if (estConnecte) client.post(`/api/musique/titres/${id}/historiser`).catch(() => {});
      setTelechargement((await HorsLigne.estTelecharge(id)) ? 'termine' : null);

      try {
        const { data: autres } = await client.get('/api/musique/titres', { params: { artiste: data.artiste, size: 20 } });
        setFileAttente((autres.content || []).filter((t) => t.id !== id));
      } catch {}

      if (estConnecte) {
        try {
          const { data: favoris } = await client.get('/api/compte/favoris');
          const existant = (favoris || []).find((f) => f.typeCible === 'TITRE' && f.referenceId === String(id));
          if (existant) { setFavori(true); setFavoriId(existant.id); }
        } catch {}
      }
    })();
  }, [id]);

  const basculerFavori = async () => {
    if (!estConnecte) { navigation.navigate('Connexion'); return; }
    if (favori && favoriId) {
      setFavori(false);
      try { await client.delete(`/api/compte/favoris/${favoriId}`); } catch { setFavori(true); }
    } else {
      setFavori(true);
      try {
        const { data } = await client.post('/api/compte/favoris', { typeCible: 'TITRE', referenceId: String(id) });
        setFavoriId(data.id);
      } catch { setFavori(false); }
    }
  };

  const chercherPosition = async (evenement) => {
    if (!sonRef.current || !dureeReelleMs || !largeurBarre) return; // pas de vrai son : rien a chercher
    const x = evenement.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / largeurBarre));
    await sonRef.current.setPositionAsync(ratio * dureeReelleMs);
  };

  /** Telechargement reel du fichier audio pour ecoute hors-ligne, via le meme service partage que "Mes telechargements" et la fiche titre. */
  const telecharger = async () => {
    if (telechargement === 'termine') {
      Alert.alert('Deja telecharge', 'Ce titre est deja disponible hors-ligne sur cet appareil.');
      return;
    }
    setTelechargement('en_cours');
    try {
      await HorsLigne.telecharger(titre, () => {});
      setTelechargement('termine');
      Alert.alert('Telechargement termine', `« ${titre.nom} » est maintenant disponible hors-ligne.`);
    } catch (e) {
      setTelechargement(null);
      Alert.alert('Telechargement indisponible', e.message || "Une erreur est survenue, verifiez votre connexion et reessayez.");
    }
  };

  /** Pas de systeme de playlists dedie pour l'instant : on reutilise les favoris, deja disponibles partout ailleurs dans l'app. */
  const ajouterAUneListe = async () => {
    if (!estConnecte) { navigation.navigate('Connexion'); return; }
    if (favori) {
      Alert.alert('Deja dans vos favoris', `« ${titre.nom} » est deja present dans vos favoris.`);
      return;
    }
    await basculerFavori();
    Alert.alert('Ajoute', `« ${titre.nom} » a ete ajoute a vos favoris.`);
  };

  /** Aucune donnee de paroles n'existe dans le modele actuel : message honnete plutot qu'un ecran vide. */
  const afficherParoles = () => {
    Alert.alert('Paroles non disponibles', "Les paroles de ce titre n'ont pas encore ete renseignees.");
  };

  /** Vrai minuteur de mise en veille : met en pause la lecture a l'echeance choisie. */
  const ouvrirMinuteur = () => {
    if (minuteurActif) {
      clearTimeout(minuteurRef.current);
      minuteurRef.current = null;
      setMinuteurActif(null);
      Alert.alert('Minuteur annule', 'La mise en pause automatique a ete annulee.');
      return;
    }
    Alert.alert('Minuteur de mise en veille', 'Mettre la lecture en pause automatiquement dans :', [
      { text: '15 min', onPress: () => demarrerMinuteur(15) },
      { text: '30 min', onPress: () => demarrerMinuteur(30) },
      { text: '45 min', onPress: () => demarrerMinuteur(45) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const demarrerMinuteur = (minutes) => {
    setMinuteurActif(minutes);
    minuteurRef.current = setTimeout(async () => {
      if (sonRef.current) await sonRef.current.pauseAsync();
      setMinuteurActif(null);
    }, minutes * 60 * 1000);
  };

  if (!titre) return <ActivityIndicator color={COLORS.musique} style={{ marginTop: 60 }} />;

  const formaterMs = (ms) => {
    const total = Math.floor(ms / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  };
  const aUnVraiSon = !!titre.fichierAudioUrl;
  const dureeAffichee = aUnVraiSon ? formaterMs(dureeReelleMs) : (titre.dureeSecondes ? formaterMs(titre.dureeSecondes * 1000) : '3:45');
  const positionAffichee = aUnVraiSon ? formaterMs(positionReelleMs) : formaterMs((titre.dureeSecondes || 225) * 1000 * progression);

  const RACCOURCIS = [
    { Icone: Download, label: telechargement === 'termine' ? 'Telecharge' : telechargement === 'en_cours' ? 'En cours...' : 'Telecharger', onPress: telecharger, actif: telechargement === 'termine' },
    { Icone: ListPlus, label: 'Ajouter a', onPress: ajouterAUneListe, actif: favori },
    { Icone: Mic2, label: 'Paroles', onPress: afficherParoles, actif: false },
    { Icone: Clock, label: minuteurActif ? `${minuteurActif} min` : 'Minuteur', onPress: ouvrirMinuteur, actif: !!minuteurActif },
  ];

  const contenu = (
    <View style={{ flex: 1 }}>
      <View style={styles.voileGeneral} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.entete}>
          <Pressable onPress={() => navigation.goBack()}><ChevronDown color="#fff" size={26} /></Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.enteteSurTitre}>LECTURE EN COURS</Text>
            <Text style={styles.enteteTitre}>Ma Musique</Text>
          </View>
          <MoreVertical color="#fff" size={22} />
        </View>

        <View style={styles.pochetteConteneur}>
          <View style={styles.pochetteOmbre}>
            {titre.imageUrl && !erreurPochette ? (
              <Image
                source={{ uri: resoudreUrlImage(titre.imageUrl) }}
                style={styles.pochette}
                onError={() => setErreurPochette(true)}
              />
            ) : (
              <LinearGradient colors={[COLORS.musique, '#0F3D24']} style={styles.pochette}>
                <IconePlaceholder style={styles.pochetteIconeConteneur} tailleIcone="42%" />
              </LinearGradient>
            )}
          </View>
          <View style={styles.badgeHQ}><Text style={styles.badgeHQTexte}>{aUnVraiSon ? 'HQ' : 'APERCU'}</Text></View>
          <Pressable style={styles.boutonCoeurPochette} onPress={basculerFavori}>
            <Heart size={16} color={favori ? COLORS.musique : '#fff'} fill={favori ? COLORS.musique : 'none'} />
          </Pressable>
        </View>

        <View style={styles.infosLigne}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titreTexte} numberOfLines={1}>{titre.nom}</Text>
            <Text style={styles.artisteTexte}>{titre.artiste}</Text>
          </View>
          <Share2 color="rgba(255,255,255,0.7)" size={19} style={{ marginRight: 16 }} />
          <MoreVertical color="rgba(255,255,255,0.7)" size={19} />
        </View>

        <View
          style={styles.progressionConteneur}
          onLayout={(e) => setLargeurBarre(e.nativeEvent.layout.width)}
        >
          <Pressable onPress={chercherPosition} hitSlop={{ top: 12, bottom: 12 }} style={styles.pisteProgression}>
            <View style={[styles.progression, { width: `${progression * 100}%` }]} />
            <View style={[styles.curseur, { left: `${progression * 100}%` }]} />
          </Pressable>
          <View style={styles.tempsLigne}>
            <Text style={styles.temps}>{positionAffichee}</Text>
            <Text style={styles.temps}>{dureeAffichee}</Text>
          </View>
        </View>

        <View style={styles.controles}>
          <Pressable onPress={() => setMelangeActif(!melangeActif)} hitSlop={10}>
            <Shuffle color={melangeActif ? COLORS.musique : 'rgba(255,255,255,0.6)'} size={20} />
          </Pressable>
          <Pressable onPress={() => allerVers('precedent')} hitSlop={10} disabled={fileAttente.length === 0}>
            <SkipBack color={fileAttente.length === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} size={26} fill={fileAttente.length === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} />
          </Pressable>
          <Pressable style={[styles.boutonLecture, !aUnVraiSon && styles.boutonLectureDesactive]} onPress={basculerLecture}>
            {enLecture ? <Pause color="#0A0A0F" size={28} fill="#0A0A0F" /> : <Play color="#0A0A0F" size={28} fill="#0A0A0F" />}
          </Pressable>
          <Pressable onPress={() => allerVers('suivant')} hitSlop={10} disabled={fileAttente.length === 0}>
            <SkipForward color={fileAttente.length === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} size={26} fill={fileAttente.length === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} />
          </Pressable>
          <Pressable onPress={() => setRepeteActif(!repeteActif)} hitSlop={10}>
            <Repeat color={repeteActif ? COLORS.musique : 'rgba(255,255,255,0.6)'} size={20} />
          </Pressable>
        </View>

        {!aUnVraiSon && (
          <Text style={styles.messageApercu}>
            Fichier audio original non disponible pour ce titre : aperçu visuel uniquement.
          </Text>
        )}

        <View style={styles.raccourcisLigne}>
          {RACCOURCIS.map((r) => (
            <Pressable key={r.label} style={styles.raccourci} onPress={r.onPress} disabled={r.label === 'En cours...'}>
              <View style={[styles.raccourciIconeFond, r.actif && styles.raccourciIconeFondActif]}>
                {r.label === 'En cours...' ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <r.Icone color={r.actif ? COLORS.musique : '#fff'} size={17} />
                )}
              </View>
              <Text style={[styles.raccourciTexte, r.actif && { color: COLORS.musique }]}>{r.label}</Text>
            </Pressable>
          ))}
        </View>

        {fileAttente.length > 0 && (
          <View style={styles.fileConteneur}>
            <View style={styles.fileEntete}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.fileTitre}>FILE D'ATTENTE</Text>
                <View style={styles.fileBadge}><Text style={styles.fileBadgeTexte}>{fileAttente.length} titres</Text></View>
              </View>
              <Pressable onPress={() => navigation.goBack()}><X color="rgba(255,255,255,0.7)" size={18} /></Pressable>
            </View>
            <FlatList
              style={{ flex: 1 }}
              data={fileAttente}
              keyExtractor={(t) => String(t.id)}
              renderItem={({ item }) => <LigneFileAttente item={item} navigation={navigation} />}
            />
          </View>
        )}
      </SafeAreaView>
    </View>
  );

  // Fond flou/teinte a partir de la pochette reelle si elle existe ; sinon,
  // degrade dans la couleur de la rubrique musique pour garder de la
  // profondeur meme sans photo.
  if (titre.imageUrl && !erreurPochette) {
    return (
      <ImageBackground source={{ uri: resoudreUrlImage(titre.imageUrl) }} style={styles.safe} blurRadius={40}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
        {contenu}
      </ImageBackground>
    );
  }
  return (
    <LinearGradient colors={['#123822', COLORS.fond, '#0A0A0F']} style={styles.safe}>
      {contenu}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  voileGeneral: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,15,0.35)' },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 6 },
  enteteSurTitre: { color: COLORS.musique, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  enteteTitre: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 2 },
  pochetteConteneur: { alignItems: 'center', marginTop: 20, paddingHorizontal: 36 },
  pochetteOmbre: {
    width: '100%', aspectRatio: 1, borderRadius: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 14,
  },
  pochette: { width: '100%', height: '100%', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  pochetteIconeConteneur: { backgroundColor: 'transparent', width: '100%', height: '100%' },
  badgeHQ: { position: 'absolute', top: 12, left: 48, borderWidth: 1, borderColor: COLORS.musique, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: 'rgba(0,0,0,0.3)' },
  badgeHQTexte: { color: COLORS.musique, fontSize: 11, fontWeight: '800' },
  boutonCoeurPochette: { position: 'absolute', top: 12, right: 48, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  infosLigne: { flexDirection: 'row', alignItems: 'center', marginTop: 22, paddingHorizontal: 30 },
  titreTexte: { color: '#fff', fontSize: 20, fontWeight: '800' },
  artisteTexte: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  progressionConteneur: { paddingHorizontal: 30, marginTop: 22 },
  pisteProgression: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  progression: { height: 4, borderRadius: 2, backgroundColor: COLORS.musique },
  curseur: { position: 'absolute', top: -5, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.musique, marginLeft: -7, shadowColor: COLORS.musique, shadowOpacity: 0.8, shadowRadius: 6 },
  tempsLigne: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  temps: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  controles: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40, marginTop: 24 },
  boutonLecture: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: COLORS.musique, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.musique, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  boutonLectureDesactive: { opacity: 0.45 },
  messageApercu: { color: 'rgba(255,255,255,0.55)', fontSize: 11, textAlign: 'center', marginTop: 10, paddingHorizontal: 30, fontStyle: 'italic' },
  raccourcisLigne: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 26, paddingHorizontal: 10 },
  raccourci: { alignItems: 'center', gap: 6 },
  raccourciIconeFond: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  raccourciIconeFondActif: { backgroundColor: 'rgba(34,197,94,0.2)' },
  raccourciTexte: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  fileConteneur: { flex: 1, marginTop: 22, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)', paddingTop: 14, paddingHorizontal: 20 },
  fileEntete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  fileTitre: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  fileBadge: { backgroundColor: 'rgba(34,197,94,0.2)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  fileBadgeTexte: { color: COLORS.musique, fontSize: 11, fontWeight: '700' },
  ligneFile: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  miniPochette: { width: 44, height: 44, borderRadius: 8 },
  miniPochetteFond: { width: 44, height: 44, borderRadius: 8, backgroundColor: COLORS.musique, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  fileLigneTitre: { color: '#fff', fontSize: 14, fontWeight: '600' },
  fileLigneArtiste: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
});
