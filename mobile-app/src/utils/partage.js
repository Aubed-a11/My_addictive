import { Share, Platform, Alert } from 'react-native';

/**
 * Partage un contenu (article, titre, evenement, produit, candidat...) de
 * maniere fiable sur toutes les plateformes.
 *
 * Sur mobile natif (iOS/Android), utilise le composant Share de React
 * Native, qui ouvre la feuille de partage systeme habituelle.
 *
 * Sur le web, Share de React Native n'est pas fiable (souvent absent ou
 * mal supporte selon le navigateur) : on utilise directement l'API web
 * navigator.share() quand le navigateur la supporte (Chrome/Safari mobile,
 * certains navigateurs desktop), et on se rabat sur une copie du texte
 * dans le presse-papiers avec confirmation visuelle sinon -- jamais un
 * echec silencieux ou un comportement inattendu.
 */
export async function partagerContenu({ titre, message, url }) {
  const texteComplet = url ? `${message}\n\n${url}` : message;

  if (Platform.OS === 'web') {
    if (navigator.share) {
      try {
        await navigator.share({ title: titre, text: message, url: url || undefined });
      } catch (erreur) {
        // AbortError : l'utilisateur a simplement annule le partage, rien a faire.
        if (erreur?.name !== 'AbortError') {
          console.warn('[Partage] navigator.share a echoue :', erreur?.message);
        }
      }
      return;
    }
    // Pas de navigator.share disponible sur ce navigateur (frequent sur
    // desktop) : on copie le texte, avec une confirmation claire plutot
    // qu'un partage qui semble ne rien faire.
    try {
      await navigator.clipboard.writeText(texteComplet);
      Alert.alert('Copie dans le presse-papiers', 'Le contenu a ete copie, tu peux maintenant le coller ou tu veux le partager.');
    } catch (erreur) {
      console.warn('[Partage] Copie presse-papiers impossible :', erreur?.message);
      Alert.alert('Partage indisponible', "Impossible de partager ou copier automatiquement sur ce navigateur.");
    }
    return;
  }

  try {
    await Share.share({ message: texteComplet, title: titre });
  } catch {
    // L'utilisateur a simplement annule le partage natif, rien a faire.
  }
}
