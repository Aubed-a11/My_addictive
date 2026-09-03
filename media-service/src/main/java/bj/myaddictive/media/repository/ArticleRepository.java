package bj.myaddictive.media.repository;

import bj.myaddictive.media.domain.Article;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArticleRepository extends JpaRepository<Article, Long> {
    Page<Article> findByStatutAndCategorie(String statut, String categorie, Pageable pageable);
    Page<Article> findByStatutAndALaUneTrue(String statut, Pageable pageable);
    Page<Article> findByStatut(String statut, Pageable pageable);
    long countByCategorie(String categorie);
}
