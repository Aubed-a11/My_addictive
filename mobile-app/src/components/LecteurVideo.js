import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { COLORS } from '../theme/colors';

/**
 * Lecteur video reel pour le direct (flux HLS .m3u8) et les replays (mp4/HLS).
 * - Mobile et web (mp4) : composant Video d'expo-av.
 * - Web + HLS : Safari lit le HLS nativement ; les autres navigateurs passent par
 *   hls.js, charge a la demande depuis un CDN.
 * Si aucune URL n'est fournie (flux masque faute de billet, ou pas encore diffuse),
 * un message explicite remplace le lecteur.
 */
const HLS_JS = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js';
let promesseHls = null;
function chargerHls() {
  if (window.Hls) return Promise.resolve(window.Hls);
  if (!promesseHls) {
    promesseHls = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = HLS_JS;
      s.onload = () => resolve(window.Hls);
      s.onerror = () => reject(new Error('hls.js indisponible'));
      document.body.appendChild(s);
    });
  }
  return promesseHls;
}

function estHls(url) { return /\.m3u8(\?|$)/i.test(url || ''); }

function LecteurWebHls({ url, enDirect }) {
  const ref = useRef(null);
  const [erreur, setErreur] = useState(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return undefined;
    let hls;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } else {
      chargerHls().then((Hls) => {
        if (!Hls?.isSupported()) { setErreur('Ce navigateur ne peut pas lire ce flux.'); return; }
        hls = new Hls({ lowLatencyMode: !!enDirect });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_, d) => { if (d.fatal) setErreur("Le flux est interrompu ou pas encore disponible."); });
      }).catch(() => setErreur('Lecteur video indisponible.'));
    }
    return () => { hls?.destroy(); };
  }, [url, enDirect]);
  if (erreur) return <Text style={styles.texte}>{erreur}</Text>;
  return React.createElement('video', { ref, controls: true, playsInline: true, autoPlay: true, style: { width: '100%', height: '100%', backgroundColor: '#000' } });
}

export default function LecteurVideo({ url, enDirect = false, messageAbsent }) {
  const [erreur, setErreur] = useState(null);
  if (!url) {
    return (
      <View style={styles.conteneur}>
        <Text style={styles.texte}>{messageAbsent || (enDirect ? "Le direct n'a pas encore commence ou votre acces n'est pas valide." : "Le replay n'est pas encore disponible.")}</Text>
      </View>
    );
  }
  return (
    <View style={styles.conteneur}>
      {Platform.OS === 'web' && estHls(url) ? (
        <LecteurWebHls url={url} enDirect={enDirect} />
      ) : (
        <>
          <Video
            source={{ uri: url }}
            style={StyleSheet.absoluteFill}
            useNativeControls
            shouldPlay
            resizeMode={ResizeMode.CONTAIN}
            onError={() => setErreur('Impossible de lire la video.')}
          />
          {erreur && <Text style={styles.texte}>{erreur}</Text>}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 14, overflow: 'hidden', marginBottom: 16, alignItems: 'center', justifyContent: 'center' },
  texte: { color: COLORS.texteAtténué, fontSize: 12, textAlign: 'center', padding: 16 },
});
