import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Voir .env.example : adapter selon l'environnement (emulateur, telephone physique, production).
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8090';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

// Intercepteur d'authentification : ajoute automatiquement le jeton JWT stocke apres connexion.
client.interceptors.request.use(async (config) => {
  const jeton = await AsyncStorage.getItem('jeton');
  if (jeton) {
    config.headers.Authorization = `Bearer ${jeton}`;
  }
  return config;
});

// Permet a AuthContext de reagir quand un jeton expire/devient invalide en
// cours d'usage (voir plus bas) : sans ca, chaque appel protege echouait en
// silence avec une erreur non geree, laissant l'utilisateur bloque dans un
// etat incoherent au lieu d'etre proprement redirige vers la connexion.
let gestionnaireDeconnexionAutomatique = null;
export function definirGestionnaireDeconnexionAutomatique(fn) {
  gestionnaireDeconnexionAutomatique = fn;
}

// Traduit les erreurs backend (format { error: "message en francais" }) en message exploitable.
// Distingue les vraies erreurs serveur (ex. mauvais mot de passe) des erreurs reseau
// (backend injoignable, mauvaise URL, CORS...) pour faciliter le diagnostic.
client.interceptors.response.use(
  (reponse) => reponse,
  async (erreur) => {
    if (erreur.response) {
      // Le serveur a repondu avec un code d'erreur (400, 401, 404, 500...).
      const message = erreur.response.data?.error || `Erreur du serveur (code ${erreur.response.status}).`;
      console.error('[API] Erreur serveur :', erreur.response.status, erreur.config?.url, erreur.response.data);

      // Jeton expire ou invalide (401) : deconnexion automatique plutot que de
      // laisser chaque ecran echouer silencieusement avec un jeton perime.
      // L'utilisateur retrouve un etat "visiteur" normal, avec une invitation
      // a se reconnecter au lieu d'erreurs en cascade.
      if (erreur.response.status === 401) {
        await AsyncStorage.multiRemove(['jeton', 'utilisateur']);
        gestionnaireDeconnexionAutomatique?.();
      }

      return Promise.reject(new Error(message));
    }
    if (erreur.request) {
      // La requete est partie mais aucune reponse n'est revenue : backend injoignable.
      console.error('[API] Aucune reponse du serveur. URL appelee :', (erreur.config?.baseURL || API_BASE_URL) + (erreur.config?.url || ''));
      return Promise.reject(new Error(
        `Impossible de joindre le serveur a l'adresse ${API_BASE_URL}. Verifiez que le backend est demarre et que cette adresse est correcte (voir mobile-app/.env).`
      ));
    }
    // Erreur avant meme l'envoi de la requete (configuration invalide, etc.).
    console.error('[API] Erreur de configuration de la requete :', erreur.message);
    return Promise.reject(new Error(`Erreur inattendue : ${erreur.message}`));
  }
);

export default client;
