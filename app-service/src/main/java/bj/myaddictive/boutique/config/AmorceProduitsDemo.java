package bj.myaddictive.boutique.config;

import bj.myaddictive.boutique.domain.Produit;
import bj.myaddictive.boutique.domain.StatutVendeur;
import bj.myaddictive.boutique.domain.Vendeur;
import bj.myaddictive.boutique.repository.ProduitRepository;
import bj.myaddictive.boutique.repository.VendeurRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Donnees de demonstration pour la boutique (marketplace multi-vendeurs,
 * section 8.1) : quelques boutiques fictives et leurs produits, avec de
 * vraies images (Picsum Photos, service de visuels d'exemple libre
 * d'utilisation - PAS des vraies marques ni des photos de produits reels,
 * juste des visuels de demonstration pour que l'app soit testable
 * visuellement des le depart). A remplacer par de vrais produits/vendeurs
 * une fois l'application en production.
 *
 * Ne s'execute qu'une seule fois (garde sur le nombre de produits deja en
 * base).
 */
@Component
@Order(1)
public class AmorceProduitsDemo implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AmorceProduitsDemo.class);

    private final VendeurRepository vendeurRepository;
    private final ProduitRepository produitRepository;

    public AmorceProduitsDemo(VendeurRepository vendeurRepository, ProduitRepository produitRepository) {
        this.vendeurRepository = vendeurRepository;
        this.produitRepository = produitRepository;
    }

    private record LigneVendeur(String nomBoutique, String categorie, String description, int grainePhoto) {}
    private record LigneProduit(String nom, String categorie, long prixFcfa, int stock, String description, int grainePhoto) {}

    @Override
    public void run(String... args) {
        if (produitRepository.count() > 3) {
            log.info("Produits de demonstration deja crees ({} en base), etape ignoree.", produitRepository.count());
            return;
        }

        List<LigneVendeur> vendeurs = List.of(
                new LigneVendeur("Addictive Wear", "MODE", "Vetements et accessoires streetwear inspires de la scene musicale beninoise.", 101),
                new LigneVendeur("Cotonou Tech Store", "HIGH_TECH", "Accessoires audio, gadgets et objets connectes.", 102),
                new LigneVendeur("Beaute Naturelle Bj", "BEAUTE", "Cosmetiques et soins a base de produits locaux.", 103)
        );

        var idsVendeurs = new java.util.ArrayList<Long>();
        long compteur = 0;
        for (LigneVendeur v : vendeurs) {
            compteur++;
            Vendeur vendeur = new Vendeur();
            // Identifiant "sentinelle" negatif : ces vendeurs de demonstration ne sont
            // rattaches a aucun compte utilisateur reel de compte-service (aucune
            // contrainte de cle etrangere entre microservices, donc sans risque),
            // mais utilisateurId est obligatoire et unique sur cette entite.
            vendeur.setUtilisateurId(-1000L - compteur);
            vendeur.setNomBoutique(v.nomBoutique());
            vendeur.setCategorie(v.categorie());
            vendeur.setDescription(v.description());
            vendeur.setImageUrl("https://picsum.photos/seed/" + v.grainePhoto() + "/400/400");
            vendeur.setStatut(StatutVendeur.VALIDE);
            vendeur.setNoteMoyenne(4.0 + (v.grainePhoto() % 10) / 10.0);
            vendeur = vendeurRepository.save(vendeur);
            idsVendeurs.add(vendeur.getId());
        }

        List<LigneProduit> produits = List.of(
                new LigneProduit("T-shirt Addictive Logo", "MODE", 15000, 40, "T-shirt 100% coton, logo brode.", 201),
                new LigneProduit("Casquette Addictive", "MODE", 8000, 60, "Casquette ajustable, broderie or.", 202),
                new LigneProduit("Hoodie Concert Edition", "MODE", 25000, 25, "Sweat a capuche, edition limitee tournee 2026.", 203),
                new LigneProduit("Sac banane Addictive", "MODE", 12000, 30, "Sac banane resistant, plusieurs poches.", 204),
                new LigneProduit("Ecouteurs sans fil Pulse", "HIGH_TECH", 22000, 15, "Autonomie 20h, reduction de bruit passive.", 301),
                new LigneProduit("Enceinte portable BoomBox Mini", "HIGH_TECH", 35000, 10, "Bluetooth 5.0, resistante aux eclaboussures.", 302),
                new LigneProduit("Power bank 10000mAh", "HIGH_TECH", 14000, 50, "Charge rapide, deux ports USB.", 303),
                new LigneProduit("Support telephone LED RGB", "HIGH_TECH", 9000, 35, "Ideal pour filmer vos lives.", 304),
                new LigneProduit("Baume levres karite", "BEAUTE", 2500, 100, "100% naturel, karite du Benin.", 401),
                new LigneProduit("Huile capillaire Coco-Karite", "BEAUTE", 6000, 45, "Nourrit et fortifie, 200ml.", 402),
                new LigneProduit("Savon noir artisanal", "BEAUTE", 3000, 80, "Fabrication traditionnelle, 150g.", 403),
                new LigneProduit("Coffret soin visage", "BEAUTE", 18000, 20, "3 produits : nettoyant, serum, creme.", 404),
                new LigneProduit("Mug Addictive Edition", "MAISON", 5000, 55, "Mug ceramique 350ml, logo email.", 501),
                new LigneProduit("Tote bag toile Addictive", "MAISON", 4500, 70, "Sac en toile epaisse, impression durable.", 502),
                new LigneProduit("Pack autocollants Addictive", "MAISON", 1500, 200, "Lot de 10 autocollants vinyle.", 503)
        );

        int cpt = 0;
        for (LigneProduit p : produits) {
            Long vendeurId = switch (p.categorie()) {
                case "MODE" -> idsVendeurs.get(0);
                case "HIGH_TECH" -> idsVendeurs.get(1);
                default -> idsVendeurs.get(2);
            };
            Produit produit = new Produit();
            produit.setVendeurId(vendeurId);
            produit.setNom(p.nom());
            produit.setCategorie(p.categorie());
            produit.setDescription(p.description());
            produit.setPrixFcfa(p.prixFcfa());
            produit.setStock(p.stock());
            produit.setImageUrl("https://picsum.photos/seed/" + p.grainePhoto() + "/500/500");
            produitRepository.save(produit);
            cpt++;
        }

        log.info("Donnees de demonstration boutique creees : {} vendeurs, {} produits.", idsVendeurs.size(), cpt);
    }
}
