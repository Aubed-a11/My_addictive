package bj.myaddictive.musique.repository;

import bj.myaddictive.musique.domain.Titre;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TitreRepository extends JpaRepository<Titre, Long> {
    Page<Titre> findByGratuitAndGenre(boolean gratuit, String genre, Pageable pageable);
    Page<Titre> findByGratuit(boolean gratuit, Pageable pageable);
    Page<Titre> findByArtiste(String artiste, Pageable pageable);
    Page<Titre> findAllByOrderByCompteurEcoutesDesc(Pageable pageable);
    Page<Titre> findAllByOrderByCompteurTelechargementsDesc(Pageable pageable);
    java.util.List<Titre> findTop10ByGenreOrderByCompteurEcoutesDesc(String genre);
    java.util.List<Titre> findByImageUrlIsNull();
}
