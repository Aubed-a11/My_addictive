package bj.myaddictive.compte.service;

import bj.myaddictive.compte.domain.CodeVerification;
import bj.myaddictive.compte.exception.ApiException;
import bj.myaddictive.compte.repository.CodeVerificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Generation et verification des codes de reinitialisation de mot de passe,
 * envoyes par email via un compte Gmail (voir config-repo/compte-service.yml
 * pour les identifiants SMTP). L'echec d'envoi n'empeche pas la creation du
 * code (trace dans les logs en repli), pour ne jamais bloquer un utilisateur
 * a cause d'un souci passager du fournisseur mail.
 */
@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CodeVerificationRepository codeVerificationRepository;
    private final JavaMailSender mailSender;

    public OtpService(CodeVerificationRepository codeVerificationRepository, JavaMailSender mailSender) {
        this.codeVerificationRepository = codeVerificationRepository;
        this.mailSender = mailSender;
    }

    private static final int MAX_TENTATIVES = 5;
    private static final long DELAI_ENTRE_ENVOIS_SECONDES = 60;

    public void envoyerCode(String email) {
        // Anti-spam : un seul code par minute et par adresse.
        codeVerificationRepository.findTopByEmailAndUtiliseFalseOrderByDateCreationDesc(email).ifPresent(dernier -> {
            if (dernier.getDateCreation().plusSeconds(DELAI_ENTRE_ENVOIS_SECONDES).isAfter(Instant.now())) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Un code vient d'etre envoye. Patientez une minute avant d'en redemander un.");
            }
        });
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        CodeVerification verification = new CodeVerification();
        verification.setEmail(email);
        verification.setCode(code);
        verification.setExpiration(Instant.now().plus(10, ChronoUnit.MINUTES));
        codeVerificationRepository.save(verification);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("My Addictive - Code de verification");
            message.setText("Voici votre code de verification : " + code
                    + "\n\nCe code expire dans 10 minutes. Si vous n'etes pas a l'origine de cette demande, ignorez cet email.");
            mailSender.send(message);
            log.info("Email de verification envoye a {}", email);
        } catch (Exception e) {
            // On ne fait jamais echouer la demande a cause d'un souci d'envoi
            // (cle revoquee, quota Gmail atteint...) : le code reste
            // verifiable via son enregistrement en base, et reste trace ici
            // pour permettre un depannage manuel si besoin.
            log.error("Echec de l'envoi de l'email de verification a {} : {}", email, e.getMessage());
            log.info("[SECOURS] Code de verification pour {} : {}", email, code);
        }
    }

    /** noRollbackFor : le compteur d'essais doit rester enregistre meme quand on rejette le code. */
    @org.springframework.transaction.annotation.Transactional(noRollbackFor = ApiException.class)
    public void verifierCode(String email, String code) {
        CodeVerification verification = codeVerificationRepository
                .findTopByEmailAndUtiliseFalseOrderByDateCreationDesc(email)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Aucun code n'a ete envoye a cet email."));

        if (verification.getExpiration().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ce code a expire, veuillez en redemander un.");
        }
        if (verification.getTentatives() >= MAX_TENTATIVES) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Trop d'essais. Redemandez un nouveau code.");
        }
        // Comparaison a temps constant (pas d'information sur les chiffres corrects).
        boolean identique = java.security.MessageDigest.isEqual(
                verification.getCode().getBytes(java.nio.charset.StandardCharsets.UTF_8),
                String.valueOf(code).getBytes(java.nio.charset.StandardCharsets.UTF_8));
        if (!identique) {
            verification.setTentatives(verification.getTentatives() + 1);
            codeVerificationRepository.save(verification);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Code de verification incorrect.");
        }
        verification.setUtilise(true);
        codeVerificationRepository.save(verification);
    }
}
