import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Send, Eye } from 'lucide-react-native';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme/colors';
import ReactionVolante from '../../components/ReactionVolante';

// Palette de couleurs attribuees aux pseudos par hachage simple, pour que
// chaque participant garde toujours la meme couleur (fidele a la maquette :
// pseudos colores distincts par utilisateur dans le fil de discussion).
const COULEURS_PSEUDO = ['#F97316', '#22C55E', '#3B82F6', '#EC4899', '#A855F7', '#06B6D4', '#EAB308'];
function couleurPourPseudo(pseudo) {
  let somme = 0;
  for (let i = 0; i < (pseudo || '').length; i++) somme += pseudo.charCodeAt(i);
  return COULEURS_PSEUDO[somme % COULEURS_PSEUDO.length];
}

const EMOJIS_REACTION = ['❤️', '🔥', '👏', '😂', '🎉'];
let compteurReactionId = 0;

/**
 * Chat en direct plein ecran (section 6.5), fidele a la maquette de
 * reference : badge LIVE + compteur de spectateurs dans l'en-tete, pseudos
 * colores, saisie fixee en bas. Reutilise les memes routes que l'onglet
 * chat integre a la fiche evenement (rafraichissement REST toutes les 4s ;
 * le canal STOMP existe deja cote backend pour une future bascule en temps
 * reel direct).
 *
 * Comprend aussi les "reactions volantes" (coeurs, feu, applaudissements...) :
 * ouvertes a tous meme sans compte, diffusees a tous les spectateurs par
 * interrogation rapide (1.5s) du serveur, pour un effet visuel partage
 * a la maniere d'un livestream Instagram/TikTok.
 */
export default function ChatLiveScreen({ navigation, route }) {
  const { id, titre } = route.params;
  const { estConnecte } = useAuth();
  const { width } = useWindowDimensions();
  const [messages, setMessages] = useState([]);
  const [spectateurs, setSpectateurs] = useState(0);
  const [texte, setTexte] = useState('');
  const [reactionsVolantes, setReactionsVolantes] = useState([]);
  const listeRef = useRef(null);
  const derniereReactionVue = useRef(Date.now());

  useEffect(() => {
    let actif = true;
    client.post(`/api/live/evenements/${id}/spectateurs/entrer`).catch(() => {});
    const rafraichir = async () => {
      try {
        const [{ data: msgs }, { data: nb }] = await Promise.all([
          client.get(`/api/live/evenements/${id}/messages`),
          client.get(`/api/live/evenements/${id}/spectateurs`),
        ]);
        if (actif) { setMessages(msgs); setSpectateurs(nb); }
      } catch {}
    };
    rafraichir();
    const intervalle = setInterval(rafraichir, 4000);
    return () => {
      actif = false;
      clearInterval(intervalle);
      client.post(`/api/live/evenements/${id}/spectateurs/sortir`).catch(() => {});
    };
  }, [id]);

  // Interrogation rapide et dediee des reactions (independante du rafraichissement
  // du chat, plus lent) : c'est ce qui donne l'impression de reactions "en direct".
  useEffect(() => {
    let actif = true;
    const interrogerReactions = async () => {
      try {
        const { data } = await client.get(`/api/live/evenements/${id}/reactions`, { params: { depuis: derniereReactionVue.current } });
        if (actif && data.length > 0) {
          derniereReactionVue.current = Date.now();
          data.forEach((emoji) => ajouterReactionVolante(emoji));
        }
      } catch {}
    };
    const intervalle = setInterval(interrogerReactions, 1500);
    return () => { actif = false; clearInterval(intervalle); };
  }, [id]);

  const ajouterReactionVolante = (emoji) => {
    const reactionId = compteurReactionId++;
    const x = 30 + Math.random() * Math.max(40, width - 100); // position horizontale de depart variee, dans les limites de l'ecran
    const derive = 20 + Math.random() * 30; // amplitude du serpentin gauche-droite
    setReactionsVolantes((precedent) => [...precedent, { reactionId, emoji, depart: { x, derive } }]);
  };

  const retirerReactionVolante = (reactionId) => {
    setReactionsVolantes((precedent) => precedent.filter((r) => r.reactionId !== reactionId));
  };

  const envoyerReaction = async (emoji) => {
    ajouterReactionVolante(emoji); // affichage optimiste immediat, sans attendre le serveur
    try { await client.post(`/api/live/evenements/${id}/reactions`, { emoji }); } catch {}
  };

  const envoyer = async () => {
    if (!texte.trim()) return;
    if (!estConnecte) {
      navigation.navigate('Connexion', { returnTo: 'ChatLive', returnToParams: route.params });
      return;
    }
    const contenu = texte.trim();
    setTexte('');
    try {
      await client.post(`/api/live/evenements/${id}/messages`, { contenu });
      const { data } = await client.get(`/api/live/evenements/${id}/messages`);
      setMessages(data);
    } catch {}
  };

  const formaterSpectateurs = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.entete}>
        <Pressable onPress={() => navigation.goBack()}><ChevronLeft color="#fff" size={26} /></Pressable>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.enteteTitre} numberOfLines={1}>{titre || 'Chat live'}</Text>
          <View style={styles.ligneSpectateurs}>
            <View style={styles.badgeLive}><Text style={styles.badgeLiveTexte}>LIVE</Text></View>
            <Eye color={COLORS.texteAtténué} size={13} />
            <Text style={styles.spectateursTexte}>{formaterSpectateurs(spectateurs)}</Text>
          </View>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          ref={listeRef}
          style={{ flex: 1 }}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.messageLigne}>
              <View style={[styles.avatar, { backgroundColor: couleurPourPseudo(item.auteur) }]}>
                <Text style={styles.avatarLettre}>{item.auteur?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.pseudo, { color: couleurPourPseudo(item.auteur) }]}>{item.auteur}</Text>
                <Text style={styles.contenuMessage}>{item.contenu}</Text>
              </View>
            </View>
          )}
          onContentSizeChange={() => listeRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<Text style={styles.vide}>Aucun message pour l'instant. Sois le premier a ecrire !</Text>}
        />

        {reactionsVolantes.map((r) => (
          <ReactionVolante
            key={r.reactionId}
            emoji={r.emoji}
            depart={r.depart}
            onTermine={() => retirerReactionVolante(r.reactionId)}
          />
        ))}
      </View>

      <View style={styles.ligneReactions}>
        {EMOJIS_REACTION.map((emoji) => (
          <Pressable key={emoji} style={styles.boutonReaction} onPress={() => envoyerReaction(emoji)}>
            <Text style={styles.boutonReactionTexte}>{emoji}</Text>
          </Pressable>
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.saisieConteneur}>
          <TextInput
            style={styles.champ}
            value={texte}
            onChangeText={setTexte}
            placeholder="Ecrire un message..."
            placeholderTextColor={COLORS.texteAtténué}
            onSubmitEditing={envoyer}
          />
          <Pressable onPress={envoyer} style={styles.boutonEnvoyer}>
            <Send color="#fff" size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.fond },
  entete: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.bordure },
  enteteTitre: { color: '#fff', fontWeight: '700', fontSize: 15 },
  ligneSpectateurs: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  badgeLive: { backgroundColor: COLORS.live, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  badgeLiveTexte: { color: '#fff', fontSize: 9, fontWeight: '800' },
  spectateursTexte: { color: COLORS.texteAtténué, fontSize: 12 },
  vide: { color: COLORS.texteAtténué, textAlign: 'center', marginTop: 40, fontSize: 13 },
  messageLigne: { flexDirection: 'row', marginBottom: 14 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarLettre: { color: '#fff', fontWeight: '800', fontSize: 13 },
  pseudo: { fontWeight: '700', fontSize: 13, marginBottom: 2 },
  contenuMessage: { color: '#fff', fontSize: 14, lineHeight: 19 },
  ligneReactions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.bordure },
  boutonReaction: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.fondCarte },
  boutonReactionTexte: { fontSize: 22 },
  saisieConteneur: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderTopWidth: 1, borderTopColor: COLORS.bordure },
  champ: { flex: 1, backgroundColor: COLORS.fondCarte, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, color: '#fff', fontSize: 14 },
  boutonEnvoyer: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.live, alignItems: 'center', justifyContent: 'center' },
});
