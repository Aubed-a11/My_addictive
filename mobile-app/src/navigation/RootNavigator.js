import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../theme/colors';

import HubScreen from '../screens/hub/HubScreen';
import SplashScreen from '../screens/demarrage/SplashScreen';
import OnboardingScreen from '../screens/demarrage/OnboardingScreen';

import LoginScreen from '../screens/auth/LoginScreen';
import InscriptionScreen from '../screens/auth/InscriptionScreen';
import MotDePasseOublieScreen from '../screens/auth/MotDePasseOublieScreen';
import ReinitialiserMotDePasseScreen from '../screens/auth/ReinitialiserMotDePasseScreen';

import MediaHomeScreen from '../screens/media/MediaHomeScreen';
import ArticleDetailScreen from '../screens/media/ArticleDetailScreen';
import OffresPromotionScreen from '../screens/media/OffresPromotionScreen';

import MusiqueHomeScreen from '../screens/musique/MusiqueHomeScreen';
import TitreDetailScreen from '../screens/musique/TitreDetailScreen';
import LecteurScreen from '../screens/musique/LecteurScreen';
import AlbumsScreen from '../screens/musique/AlbumsScreen';
import ClassementMusiqueScreen from '../screens/musique/ClassementMusiqueScreen';
import RecommandationsScreen from '../screens/musique/RecommandationsScreen';
import MesTelechargementsScreen from '../screens/musique/MesTelechargementsScreen';
import MesAchatsMusiqueScreen from '../screens/musique/MesAchatsMusiqueScreen';

import EvenementsListeScreen from '../screens/live/EvenementsListeScreen';
import EvenementDetailScreen from '../screens/live/EvenementDetailScreen';
import ChatLiveScreen from '../screens/live/ChatLiveScreen';
import MesBilletsScreen from '../screens/live/MesBilletsScreen';
import ChainesScreen from '../screens/live/ChainesScreen';
import ChaineDetailScreen from '../screens/live/ChaineDetailScreen';
import PodcastsScreen from '../screens/live/PodcastsScreen';
import CreerEvenementScreen from '../screens/live/CreerEvenementScreen';

import CompetitionsListeScreen from '../screens/votes/CompetitionsListeScreen';
import CandidatsScreen from '../screens/votes/CandidatsScreen';
import CandidatDetailScreen from '../screens/votes/CandidatDetailScreen';
import PortefeuilleScreen from '../screens/votes/PortefeuilleScreen';

import BoutiqueHomeScreen from '../screens/boutique/BoutiqueHomeScreen';
import ProduitDetailScreen from '../screens/boutique/ProduitDetailScreen';
import PanierScreen from '../screens/boutique/PanierScreen';
import MesCommandesScreen from '../screens/boutique/MesCommandesScreen';
import InscriptionVendeurScreen from '../screens/boutique/InscriptionVendeurScreen';
import BoutiqueVendeurScreen from '../screens/boutique/BoutiqueVendeurScreen';

import ProfilScreen from '../screens/compte/ProfilScreen';
import FavorisScreen from '../screens/compte/FavorisScreen';
import ParametresScreen from '../screens/compte/ParametresScreen';
import TransactionsScreen from '../screens/compte/TransactionsScreen';
import HistoriqueVotesScreen from '../screens/compte/HistoriqueVotesScreen';
import HistoriqueEcouteScreen from '../screens/compte/HistoriqueEcouteScreen';
import BadgesScreen from '../screens/compte/BadgesScreen';

const Stack = createNativeStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: COLORS.fond, card: COLORS.fond, text: '#fff', border: COLORS.bordure },
};

const optionsEcran = { headerStyle: { backgroundColor: COLORS.fond }, headerTintColor: '#fff', headerTitleStyle: { color: '#fff' } };

/**
 * Navigation en pile unique organisee "hub-and-spoke" (section 3.3) : Hub
 * comme racine, chaque rubrique accessible depuis les tuiles, retour au hub
 * possible a tout moment. La connexion (Login/Inscription/Otp) s'ouvre par
 * dessus, jamais au demarrage (regle d'acces libre, section 3.1).
 */
export default function RootNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator initialRouteName="Splash" screenOptions={optionsEcran}>
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Hub" component={HubScreen} options={{ headerShown: false }} />

        <Stack.Screen name="Connexion" component={LoginScreen} options={{ title: 'Connexion' }} />
        <Stack.Screen name="Inscription" component={InscriptionScreen} options={{ title: 'Creer un compte' }} />
        <Stack.Screen name="MotDePasseOublie" component={MotDePasseOublieScreen} options={{ title: 'Mot de passe oublie' }} />
        <Stack.Screen name="ReinitialiserMotDePasse" component={ReinitialiserMotDePasseScreen} options={{ title: 'Nouveau mot de passe' }} />

        <Stack.Screen name="MediaHome" component={MediaHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} options={{ title: 'Article' }} />
        <Stack.Screen name="OffresPromotion" component={OffresPromotionScreen} options={{ title: 'Offres de promotion' }} />

        <Stack.Screen name="MusiqueHome" component={MusiqueHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="TitreDetail" component={TitreDetailScreen} options={{ title: 'Titre' }} />
        <Stack.Screen name="Lecteur" component={LecteurScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Albums" component={AlbumsScreen} options={{ title: 'Albums' }} />
        <Stack.Screen name="ClassementMusique" component={ClassementMusiqueScreen} options={{ title: 'Nos Top' }} />
        <Stack.Screen name="Recommandations" component={RecommandationsScreen} options={{ title: 'Pour vous' }} />
        <Stack.Screen name="MesTelechargements" component={MesTelechargementsScreen} options={{ title: 'Hors ligne' }} />
        <Stack.Screen name="MesAchatsMusique" component={MesAchatsMusiqueScreen} options={{ title: 'Mes achats' }} />

        <Stack.Screen name="EvenementsListe" component={EvenementsListeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="EvenementDetail" component={EvenementDetailScreen} options={{ title: 'Evenement' }} />
        <Stack.Screen name="ChatLive" component={ChatLiveScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MesBillets" component={MesBilletsScreen} options={{ title: 'Mes billets' }} />
        <Stack.Screen name="Chaines" component={ChainesScreen} options={{ title: 'Chaines' }} />
        <Stack.Screen name="ChaineDetail" component={ChaineDetailScreen} options={{ title: 'Chaine' }} />
        <Stack.Screen name="Podcasts" component={PodcastsScreen} options={{ title: 'Podcasts' }} />
        <Stack.Screen name="CreerEvenement" component={CreerEvenementScreen} options={{ title: 'Creer un evenement' }} />

        <Stack.Screen name="CompetitionsListe" component={CompetitionsListeScreen} options={{ title: 'Competitions & Votes' }} />
        <Stack.Screen name="Candidats" component={CandidatsScreen} options={{ title: 'Candidats' }} />
        <Stack.Screen name="CandidatDetail" component={CandidatDetailScreen} options={{ title: 'Candidat' }} />
        <Stack.Screen name="Portefeuille" component={PortefeuilleScreen} options={{ title: 'Portefeuille' }} />

        <Stack.Screen name="BoutiqueHome" component={BoutiqueHomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProduitDetail" component={ProduitDetailScreen} options={{ title: 'Produit' }} />
        <Stack.Screen name="Panier" component={PanierScreen} options={{ title: 'Panier' }} />
        <Stack.Screen name="MesCommandes" component={MesCommandesScreen} options={{ title: 'Mes commandes' }} />
        <Stack.Screen name="InscriptionVendeur" component={InscriptionVendeurScreen} options={{ title: 'Ouvrir ma boutique' }} />
        <Stack.Screen name="BoutiqueVendeur" component={BoutiqueVendeurScreen} options={{ title: 'Boutique' }} />

        <Stack.Screen name="Profil" component={ProfilScreen} options={{ title: 'Mon compte' }} />
        <Stack.Screen name="Favoris" component={FavorisScreen} options={{ title: 'Mes favoris' }} />
        <Stack.Screen name="Parametres" component={ParametresScreen} options={{ title: 'Parametres' }} />
        <Stack.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'Mes transactions' }} />
        <Stack.Screen name="HistoriqueVotes" component={HistoriqueVotesScreen} options={{ title: 'Historique de votes' }} />
        <Stack.Screen name="HistoriqueEcoute" component={HistoriqueEcouteScreen} options={{ title: "Historique d'ecoute" }} />
        <Stack.Screen name="Badges" component={BadgesScreen} options={{ title: 'Mes badges' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
