import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';

/**
 * Sondages en direct (section 6.5) : un seul vote par utilisateur et par
 * sondage. Les resultats se rafraichissent par sondage REST (le backend
 * les diffuse aussi en temps reel via STOMP sur /topic/evenement/{id}/sondages
 * pour une future integration websocket cote client).
 */
export default function SondageEnDirect({ navigation, evenementId }) {
  const { estConnecte } = useAuth();
  const [sondages, setSondages] = useState([]);
  const [enVote, setEnVote] = useState(null);

  const charger = useCallback(async () => {
    try {
      const { data } = await client.get(`/api/live/evenements/${evenementId}/sondages`);
      setSondages(data);
    } catch {}
  }, [evenementId]);

  useEffect(() => {
    charger();
    const intervalle = setInterval(charger, 5000);
    return () => clearInterval(intervalle);
  }, [charger]);

  const voter = async (sondageId, optionId) => {
    if (!estConnecte) {
      navigation.navigate('Connexion', { returnTo: 'EvenementDetail', returnToParams: { id: evenementId } });
      return;
    }
    setEnVote(optionId);
    try {
      await client.post(`/api/live/sondages/${sondageId}/voter`, { optionId });
      charger();
    } catch {
      // Message d'erreur discret : la contrainte "un seul vote" declenche souvent un 409 attendu.
    } finally {
      setEnVote(null);
    }
  };

  if (sondages.length === 0) return null;

  return (
    <View style={styles.conteneur}>
      {sondages.map((s) => (
        <View key={s.sondageId} style={styles.carte}>
          <Text style={styles.question}>{s.question}</Text>
          {s.options.map((o) => {
            const aVoteIci = s.optionVoteeParMoi === o.optionId;
            const aDejaVote = s.optionVoteeParMoi != null;
            return (
              <Pressable
                key={o.optionId}
                style={styles.option}
                disabled={aDejaVote || enVote === o.optionId}
                onPress={() => voter(s.sondageId, o.optionId)}
              >
                <View style={[styles.barreFond, { width: `${o.pourcentage}%` }, aVoteIci && styles.barreVotee]} />
                <View style={styles.optionContenu}>
                  <Text style={styles.optionTexte}>{o.texte}{aVoteIci ? ' ✓' : ''}</Text>
                  {aDejaVote && <Text style={styles.optionPourcentage}>{o.pourcentage.toFixed(0)}%</Text>}
                </View>
              </Pressable>
            );
          })}
          <Text style={styles.total}>{s.totalVotes} vote{s.totalVotes > 1 ? 's' : ''}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { paddingHorizontal: 20, marginBottom: 10 },
  carte: { backgroundColor: COLORS.fondCarte, borderRadius: 14, padding: 14, marginBottom: 10 },
  question: { color: '#fff', fontWeight: '700', fontSize: 14, marginBottom: 10 },
  option: { borderRadius: 10, overflow: 'hidden', marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  barreFond: { position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: 'rgba(239,68,68,0.25)' },
  barreVotee: { backgroundColor: 'rgba(239,68,68,0.45)' },
  optionContenu: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12 },
  optionTexte: { color: '#fff', fontSize: 13 },
  optionPourcentage: { color: COLORS.texteAtténué, fontSize: 12, fontWeight: '700' },
  total: { color: COLORS.texteAtténué, fontSize: 11, textAlign: 'right' },
});
