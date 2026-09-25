package bj.myaddictive.musique.repository;

import bj.myaddictive.musique.domain.Titre;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TitreRepository extends JpaRepository<Titre, Long> {
    // Le champ genre stocke plusieurs etiquettes concatenees par "#" (ex.
    // "afro#gospel#"), heritage de l'import des donnees legacy : une
    // correspondance exacte ne matchait donc jamais aucun genre individuel
    // reel (findByGenre("gospel") ne trouvait rien pour "afro#gospel#").
    // "Containing" cherche la sous-chaine, ce qui fonctionne correctement
    // avec ce format.
    Page<Titre> findByGratuitAndGenreContaining(boolean gratuit, String genre, Pageable pageable);
    Page<Titre> findByGenreContaining(String genre, Pageable pageable);
    Page<Titre> findByGratuit(boolean gratuit, Pageable pageable);
    Page<Titre> findByArtiste(String artiste, Pageable pageable);
    Page<Titre> findByAlbumId(Long albumId, Pageable pageable);
    Page<Titre> findAllByOrderByCompteurEcoutesDesc(Pageable pageable);
    Page<Titre> findAllByOrderByCompteurTelechargementsDesc(Pageable pageable);
    Page<Titre> findByGratuitOrderByCompteurTelechargementsDesc(boolean gratuit, Pageable pageable);
    Page<Titre> findByYoutubeUrlIsNotNullOrderByDateAjoutDesc(Pageable pageable);
    java.util.List<Titre> findTop10ByGenreContainingOrderByCompteurEcoutesDesc(String genre);
    java.util.List<Titre> findByImageUrlIsNull();
    java.util.List<Titre> findByMisEnAvantTrue();

    // Variantes des classements donnant priorite aux titres mis en avant
    // manuellement depuis le dashboard (section "Tops"), avant le tri
    // automatique habituel. Un titre mis en avant sans rang precis (rang
    // null) passe apres ceux qui en ont un, mais toujours avant le tri
    // automatique.
    @org.springframework.data.jpa.repository.Query(
        "SELECT t FROM Titre t ORDER BY COALESCE(t.misEnAvant, false) DESC, " +
        "CASE WHEN t.rangMiseEnAvant IS NULL THEN 1 ELSE 0 END, t.rangMiseEnAvant ASC, t.compteurEcoutes DESC")
    Page<Titre> classementStreamingAvecMiseEnAvant(Pageable pageable);

    @org.springframework.data.jpa.repository.Query(
        "SELECT t FROM Titre t WHERE t.gratuit = true ORDER BY COALESCE(t.misEnAvant, false) DESC, " +
        "CASE WHEN t.rangMiseEnAvant IS NULL THEN 1 ELSE 0 END, t.rangMiseEnAvant ASC, t.compteurTelechargements DESC")
    Page<Titre> classementTelechargementAvecMiseEnAvant(Pageable pageable);
}
