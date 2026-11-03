package bj.myaddictive.compte.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Sert les photos de profil uploadees par les utilisateurs (section 9.2,
 * modification de la photo), depuis un dossier local hors du jar. Meme
 * schema que ConfigurationFichiersStatiques dans media-service : chemin
 * relatif a la racine du projet en local, surchargeable en Docker (voir
 * docker-compose.yml).
 */
@Configuration
public class ConfigurationFichiersStatiques implements WebMvcConfigurer {

    @Value("${app.uploads-path:./compte-service/uploads/}")
    private String cheminUploads;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String chemin = cheminUploads.endsWith("/") ? cheminUploads : cheminUploads + "/";
        registry.addResourceHandler("/api/compte/fichiers/**")
                .addResourceLocations("file:" + chemin)
                .setCachePeriod(3600);
    }
}
