import { Alert, Platform } from 'react-native';

/**
 * Sur le web, Alert.alert de React Native ne fait RIEN (fonction vide dans react-native-web) :
 * toutes les erreurs et informations affichees par Alert.alert etaient donc invisibles dans
 * la version web / PWA. On le remplace par les boites de dialogue du navigateur.
 * Sur mobile natif, rien ne change.
 */
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (titre, message, boutons) => {
    const texte = [titre, message].filter(Boolean).join('\n\n');
    const liste = Array.isArray(boutons) ? boutons : [];
    if (liste.length > 1) {
      const confirme = window.confirm(texte);
      const cible = confirme
        ? liste.find((b) => b.style !== 'cancel')
        : liste.find((b) => b.style === 'cancel');
      if (cible && typeof cible.onPress === 'function') cible.onPress();
    } else {
      window.alert(texte);
      if (liste[0] && typeof liste[0].onPress === 'function') liste[0].onPress();
    }
  };
}
