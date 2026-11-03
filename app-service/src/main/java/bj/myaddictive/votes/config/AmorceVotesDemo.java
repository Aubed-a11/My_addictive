package bj.myaddictive.votes.config;

import bj.myaddictive.votes.domain.Candidat;
import bj.myaddictive.votes.domain.Competition;
import bj.myaddictive.votes.domain.PhaseCompetition;
import bj.myaddictive.votes.domain.StatutCandidat;
import bj.myaddictive.votes.repository.CandidatRepository;
import bj.myaddictive.votes.repository.CompetitionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Competition et candidats de demonstration (section 7, "Talent shows et
 * votes"), avec de vraies images (Picsum Photos, libre d'utilisation).
 * Idempotent : ne s'execute qu'une seule fois.
 */
@Component
@Order(1)
public class AmorceVotesDemo implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AmorceVotesDemo.class);
    private static final String MARQUEUR = "[DEMO]";

    private final CompetitionRepository competitionRepository;
    private final CandidatRepository candidatRepository;

    public AmorceVotesDemo(CompetitionRepository competitionRepository, CandidatRepository candidatRepository) {
        this.competitionRepository = competitionRepository;
        this.candidatRepository = candidatRepository;
    }

    private record LigneCandidat(String nom, String ville, int grainePhoto) {}

    @Override
    public void run(String... args) {
        boolean dejaFait = competitionRepository.findAll().stream().anyMatch(c -> c.getNom() != null && c.getNom().startsWith(MARQUEUR));
        if (dejaFait) {
            log.info("Competition de demonstration deja creee, etape ignoree.");
            return;
        }

        Competition competition = new Competition();
        competition.setNom(MARQUEUR + " Talent Show 2026");
        competition.setCategorie("MUSIQUE");
        competition.setSaison("2026");
        competition.setPhase(PhaseCompetition.ELIMINATIONS);
        competition.setPonderationPublic(0.6);
        competition.setPonderationJury(0.4);
        competition = competitionRepository.save(competition);

        List<LigneCandidat> candidats = List.of(
                new LigneCandidat("Queen A", "Cotonou", 801),
                new LigneCandidat("FanBeni", "Porto-Novo", 802),
                new LigneCandidat("Young OG", "Abomey-Calavi", 803),
                new LigneCandidat("StarBoy Bj", "Parakou", 804),
                new LigneCandidat("Melodia", "Cotonou", 805),
                new LigneCandidat("King Jay", "Ouidah", 806)
        );

        int cpt = 0;
        for (LigneCandidat l : candidats) {
            Candidat c = new Candidat();
            c.setCompetitionId(competition.getId());
            c.setNom(l.nom());
            c.setVille(l.ville());
            c.setPhotoUrl("https://picsum.photos/seed/" + l.grainePhoto() + "/400/400");
            c.setStatut(StatutCandidat.EN_LICE);
            c.setNoteJury(6.0 + (l.grainePhoto() % 4));
            candidatRepository.save(c);
            cpt++;
        }

        log.info("Competition de demonstration creee avec {} candidats.", cpt);
    }
}
