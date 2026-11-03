package bj.myaddictive.musique.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

/** Tests de la normalisation de la recherche musique (insensible aux accents, a la casse et a la ponctuation). */
class MusiqueServiceRechercheTest {

    @Test
    void retireLesAccentsEtMetEnMinuscules() {
        assertEquals("ete en folie", MusiqueService.normaliserRecherche("Été EN Folie"));
    }

    @Test
    void remplaceLaPonctuationParDesEspaces() {
        assertEquals("karmelle vano", MusiqueService.normaliserRecherche("  Karmelle - Vano!! "));
    }

    @Test
    void nullDonneChaineVide() {
        assertEquals("", MusiqueService.normaliserRecherche(null));
    }

    @Test
    void chaineVideResteVide() {
        assertEquals("", MusiqueService.normaliserRecherche("   "));
    }
}
