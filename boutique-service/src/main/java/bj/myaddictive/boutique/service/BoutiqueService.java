package bj.myaddictive.boutique.service;

import bj.myaddictive.boutique.domain.*;
import bj.myaddictive.boutique.dto.AjouterPanierRequest;
import bj.myaddictive.boutique.dto.InitierCommandeRequest;
import bj.myaddictive.boutique.dto.InscriptionVendeurRequest;
import bj.myaddictive.boutique.exception.ApiException;
import bj.myaddictive.boutique.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class BoutiqueService {

    private final VendeurRepository vendeurRepository;
    private final ProduitRepository produitRepository;
    private final PanierItemRepository panierItemRepository;
    private final CommandeRepository commandeRepository;
    private final LigneCommandeRepository ligneCommandeRepository;
    private final WebClient.Builder webClientBuilder;

    public BoutiqueService(VendeurRepository vendeurRepository, ProduitRepository produitRepository,
                            PanierItemRepository panierItemRepository, CommandeRepository commandeRepository,
                            LigneCommandeRepository ligneCommandeRepository, WebClient.Builder webClientBuilder) {
        this.vendeurRepository = vendeurRepository;
        this.produitRepository = produitRepository;
        this.panierItemRepository = panierItemRepository;
        this.commandeRepository = commandeRepository;
        this.ligneCommandeRepository = ligneCommandeRepository;
        this.webClientBuilder = webClientBuilder;
    }

    /** Formulaire de demande d'ouverture de boutique (section 8.1) : reste EN_ATTENTE jusqu'a validation admin. */
    public Vendeur demanderOuvertureBoutique(Long utilisateurId, InscriptionVendeurRequest requete) {
        if (vendeurRepository.findByUtilisateurId(utilisateurId).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Une boutique existe deja pour ce compte.");
        }
        Vendeur vendeur = new Vendeur();
        vendeur.setUtilisateurId(utilisateurId);
        vendeur.setNomBoutique(requete.nomBoutique());
        vendeur.setDescription(requete.description());
        vendeur.setImageUrl(requete.imageUrl());
        vendeur.setCategorie(requete.categorie());
        vendeur.setStatut(StatutVendeur.EN_ATTENTE);
        return vendeurRepository.save(vendeur);
    }

    public Page<Vendeur> listerVendeursValides(Pageable pageable) {
        return vendeurRepository.findByStatut(StatutVendeur.VALIDE, pageable);
    }

    /** Vue back-office : tous les vendeurs, ou filtres par statut (ex. EN_ATTENTE a valider). */
    public Page<Vendeur> listerTousVendeurs(StatutVendeur statutFiltre, Pageable pageable) {
        if (statutFiltre != null) return vendeurRepository.findByStatut(statutFiltre, pageable);
        return vendeurRepository.findAll(pageable);
    }

    public Vendeur obtenirVendeur(Long id) {
        return vendeurRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Boutique introuvable."));
    }

    /** Action reservee au back office (section 28.5) : valider/refuser/suspendre une boutique. */
    public Vendeur changerStatutVendeur(Long id, StatutVendeur statut) {
        Vendeur vendeur = obtenirVendeur(id);
        vendeur.setStatut(statut);
        return vendeurRepository.save(vendeur);
    }

    public Page<Produit> listerProduits(String categorie, Long vendeurId, Pageable pageable) {
        if (vendeurId != null) return produitRepository.findByVendeurId(vendeurId, pageable);
        if (categorie != null && !categorie.isBlank()) return produitRepository.findByCategorie(categorie, pageable);
        return produitRepository.findAll(pageable);
    }

    /** Drops limites avec compte a rebours (section 8.2), utilisables par tout vendeur. */
    public Page<Produit> listerDrops(Pageable pageable) {
        return produitRepository.findByDropLimiteTrueOrderByDateDebutDropAsc(pageable);
    }

    public Produit obtenirProduit(Long id) {
        return produitRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Produit introuvable."));
    }

    public Produit publierProduit(Long utilisateurId, Produit produit) {
        Vendeur vendeur = vendeurRepository.findByUtilisateurId(utilisateurId)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Aucune boutique associee a ce compte."));
        if (vendeur.getStatut() != StatutVendeur.VALIDE) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Votre boutique doit etre validee par l'administration avant de publier un produit.");
        }
        produit.setVendeurId(vendeur.getId());
        return produitRepository.save(produit);
    }

    /**
     * Publication d'un produit par le back-office admin : contrairement a
     * publierProduit(), pas de verification de propriete de boutique (l'admin
     * peut publier pour n'importe quel vendeur, en precisant vendeurId).
     */
    public Produit creerProduitAdmin(Produit produit) {
        return produitRepository.save(produit);
    }

    public Produit modifierProduitAdmin(Long id, Produit donnees) {
        Produit produit = obtenirProduit(id);
        produit.setNom(donnees.getNom());
        produit.setDescription(donnees.getDescription());
        produit.setCategorie(donnees.getCategorie());
        produit.setPrixFcfa(donnees.getPrixFcfa());
        produit.setStock(donnees.getStock());
        produit.setImageUrl(donnees.getImageUrl());
        produit.setDropLimite(donnees.isDropLimite());
        produit.setDateDebutDrop(donnees.getDateDebutDrop());
        if (donnees.getVendeurId() != null) produit.setVendeurId(donnees.getVendeurId());
        return produitRepository.save(produit);
    }

    public void supprimerProduit(Long id) {
        if (!produitRepository.existsById(id)) throw new ApiException(HttpStatus.NOT_FOUND, "Produit introuvable.");
        produitRepository.deleteById(id);
    }

    public List<bj.myaddictive.boutique.dto.PanierItemResponse> panier(Long utilisateurId) {
        return panierItemRepository.findByUtilisateurId(utilisateurId).stream()
                .map(item -> {
                    Produit produit = produitRepository.findById(item.getProduitId()).orElse(null);
                    return bj.myaddictive.boutique.dto.PanierItemResponse.fromEntities(item, produit);
                })
                .toList();
    }

    @Transactional
    public PanierItem ajouterAuPanier(Long utilisateurId, AjouterPanierRequest requete) {
        Produit produit = obtenirProduit(requete.produitId());
        if (produit.isDropLimite() && produit.getDateDebutDrop() != null && produit.getDateDebutDrop().isAfter(java.time.Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ce drop n'est pas encore en vente.");
        }
        return panierItemRepository.findByUtilisateurIdAndProduitId(utilisateurId, requete.produitId())
                .map(item -> { item.setQuantite(item.getQuantite() + requete.quantite()); return panierItemRepository.save(item); })
                .orElseGet(() -> {
                    PanierItem item = new PanierItem();
                    item.setUtilisateurId(utilisateurId);
                    item.setProduitId(requete.produitId());
                    item.setQuantite(requete.quantite());
                    return panierItemRepository.save(item);
                });
    }

    public void retirerDuPanier(Long utilisateurId, Long panierItemId) {
        PanierItem item = panierItemRepository.findById(panierItemId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Article introuvable dans le panier."));
        if (!item.getUtilisateurId().equals(utilisateurId)) throw new ApiException(HttpStatus.FORBIDDEN, "Cet article n'appartient pas a votre panier.");
        panierItemRepository.delete(item);
    }

    /**
     * Valide le panier (potentiellement multi-vendeurs) : cree la Commande et
     * ses LigneCommande en EN_ATTENTE, puis delegue le paiement. La commande
     * n'est confirmee (statut PAYEE, stock decompte) qu'a la reception de
     * l'evenement RabbitMQ de paiement reussi.
     */
    @Transactional
    public Map<String, Object> initierCommande(String userId, InitierCommandeRequest requete) {
        Long utilisateurId = Long.valueOf(userId);
        List<PanierItem> items = panierItemRepository.findByUtilisateurId(utilisateurId);
        if (items.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "Le panier est vide.");

        long total = 0L;
        Commande commande = new Commande();
        commande.setUtilisateurId(utilisateurId);
        commande.setMontantTotalFcfa(0L);
        commande = commandeRepository.save(commande);

        for (PanierItem item : items) {
            Produit produit = obtenirProduit(item.getProduitId());
            if (produit.getStock() < item.getQuantite()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Stock insuffisant pour \"" + produit.getNom() + "\".");
            }
            LigneCommande ligne = new LigneCommande();
            ligne.setCommandeId(commande.getId());
            ligne.setVendeurId(produit.getVendeurId());
            ligne.setProduitId(produit.getId());
            ligne.setNomProduit(produit.getNom());
            ligne.setQuantite(item.getQuantite());
            ligne.setPrixUnitaireFcfa(produit.getPrixFcfa());
            ligneCommandeRepository.save(ligne);
            total += produit.getPrixFcfa() * item.getQuantite();
        }
        commande.setMontantTotalFcfa(total);
        commandeRepository.save(commande);
        panierItemRepository.deleteByUtilisateurId(utilisateurId);

        Map<String, Object> corps = Map.of(
                "moyenPaiement", requete.moyenPaiement(),
                "montantFcfa", total,
                "typeObjet", "COMMANDE",
                "referenceId", String.valueOf(commande.getId())
        );
        return webClientBuilder.build().post()
                .uri("http://paiement-service/api/paiement/transactions")
                .header("X-User-Id", userId)
                .bodyValue(corps)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    public List<Commande> mesCommandes(Long utilisateurId) {
        return commandeRepository.findByUtilisateurIdOrderByDateCommandeDesc(utilisateurId);
    }

    public List<LigneCommande> lignesDeCommande(Long commandeId) {
        return ligneCommandeRepository.findByCommandeId(commandeId);
    }
}
