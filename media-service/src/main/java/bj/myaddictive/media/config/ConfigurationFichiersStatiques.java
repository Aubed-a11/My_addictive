package bj.myaddictive.media.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Sert les fichiers image importes de l'ancien site (pochettes d'album,
 * visuels de titre...) directement depuis ce backend, plutot que de
 * dependre d'un hebergement externe dont la disponibilite ne peut pas etre
 * garantie. Arborescence attendue dans le dossier configure :
 *
 *   {app.uploads-path}/artistes/albums/{numero}/small_{fichier}
 *   {app.uploads-path}/artistes/tracks/{numero}/{fichier}
 *
 * Le chemin par defaut ("./media-service/uploads/") est relatif a la RACINE
 * du projet, car start-tout.ps1/.sh lance tous les services avec la racine
 * comme repertoire de travail (meme convention que les bases H2). En
 * conteneur Docker, chaque service tourne isole avec son propre systeme de
 * fichiers : app.uploads-path est alors surchargee (voir docker-compose.yml)
 * vers un simple "./uploads/" local au conteneur, monte en volume.
 *
 * Expose sous /api/media/fichiers/** (chemin complet conserve, la gateway
 * ne retire pas de prefixe avant de transmettre la requete a ce service).
 */
@Configuration
public class ConfigurationFichiersStatiques implements WebMvcConfigurer {

    @Value("${app.uploads-path:./media-service/uploads/}")
    private String cheminUploads;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String chemin = cheminUploads.endsWith("/") ? cheminUploads : cheminUploads + "/";
        registry.addResourceHandler("/api/media/fichiers/**")
                .addResourceLocations("file:" + chemin)
                .setCachePeriod(3600);
    }
}
