package bj.myaddictive.media.config;

import bj.myaddictive.media.domain.Article;
import bj.myaddictive.media.repository.ArticleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Quelques articles de demonstration AVEC de vraies images (Picsum Photos,
 * visuels d'exemple libres d'utilisation), en complement des 1194 articles
 * legacy importes depuis l'ancien site (dont les images ne sont pas
 * accessibles, voir ImporteurLegacyArticles). Objectif : avoir des visuels
 * garantis fonctionnels des le depart, pendant qu'un vrai jeu d'images est
 * recupere pour les articles historiques.
 */
@Component
@Order(2) // apres ImporteurLegacyArticles, pour ne pas fausser sa garde sur le nombre d'articles
public class AmorceArticlesDemo implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AmorceArticlesDemo.class);
    private static final String MARQUEUR = "[DEMO]";

    private final ArticleRepository articleRepository;

    public AmorceArticlesDemo(ArticleRepository articleRepository) {
        this.articleRepository = articleRepository;
    }

    private record LigneArticle(String titre, String chapo, String categorie, boolean aLaUne, int grainePhoto) {}

    @Override
    public void run(String... args) {
        boolean dejaFait = articleRepository.findAll().stream().anyMatch(a -> a.getTitre() != null && a.getTitre().startsWith(MARQUEUR));
        if (dejaFait) {
            log.info("Articles de demonstration deja crees, etape ignoree.");
            return;
        }

        List<LigneArticle> lignes = List.of(
                new LigneArticle("Nouvel album annonce pour la rentree", "Un des artistes les plus suivis de la scene beninoise prepare un projet surprise.", "ACTUALITE", true, 601),
                new LigneArticle("Retour en images sur le dernier festival", "Ambiance, coulisses et temps forts de l'evenement qui a marque les esprits.", "SHOWBIZ", true, 602),
                new LigneArticle("Interview exclusive : les coulisses d'une tournee", "Rencontre avec l'equipe organisatrice pour comprendre les defis logistiques.", "ACTUALITE", false, 603),
                new LigneArticle("Le clip du moment fait sensation", "Deja plusieurs milliers de vues en quelques heures seulement.", "VIDEO", true, 604),
                new LigneArticle("Portrait : une nouvelle voix qui monte", "Zoom sur un talent emergent repere lors des dernieres selections.", "SHOWBIZ", false, 605),
                new LigneArticle("Les temps forts de la semaine musicale", "Retour sur les sorties, annonces et evenements marquants.", "ACTUALITE", false, 606)
        );

        int cpt = 0;
        for (LigneArticle l : lignes) {
            Article a = new Article();
            a.setTitre(MARQUEUR + " " + l.titre());
            a.setChapo(l.chapo());
            a.setContenu(l.chapo() + "\n\nArticle de demonstration genere automatiquement pour illustrer l'affichage des visuels dans l'application.");
            a.setImageUrl("https://picsum.photos/seed/" + l.grainePhoto() + "/800/500");
            a.setCategorie(l.categorie());
            a.setALaUne(l.aLaUne());
            a.setStatut("PUBLIE");
            a.setCompteurVues((long) (l.grainePhoto() * 3));
            articleRepository.save(a);
            cpt++;
        }

        log.info("Articles de demonstration crees : {}.", cpt);
    }
}
