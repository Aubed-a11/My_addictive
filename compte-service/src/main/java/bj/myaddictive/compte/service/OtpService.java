package bj.myaddictive.compte.service;

import bj.myaddictive.compte.domain.CodeVerification;
import bj.myaddictive.compte.exception.ApiException;
import bj.myaddictive.compte.repository.CodeVerificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

/**
 * Generation et verification des codes de reinitialisation de mot de passe,
 * envoyes par email. L'envoi effectif (SMTP, SendGrid, Mailgun...) est a
 * brancher dans envoyerCode() avant la mise en production : ici l'envoi est
 * simule et le code est trace dans les logs pour permettre les tests de
 * bout en bout sans dependre d'un compte email payant.
 */
@Service
public class OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpService.class);
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CodeVerificationRepository codeVerificationRepository;

    public OtpService(CodeVerificationRepository codeVerificationRepository) {
        this.codeVerificationRepository = codeVerificationRepository;
    }

    public void envoyerCode(String email) {
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));

        CodeVerification verification = new CodeVerification();
        verification.setEmail(email);
        verification.setCode(code);
        verification.setExpiration(Instant.now().plus(10, ChronoUnit.MINUTES));
        codeVerificationRepository.save(verification);

        // TODO production : appeler un fournisseur d'envoi d'email (SMTP, SendGrid, Mailgun...) ici.
        log.info("[SIMULATION EMAIL] Code de verification pour {} : {}", email, code);
    }

    public void verifierCode(String email, String code) {
        CodeVerification verification = codeVerificationRepository
                .findTopByEmailAndUtiliseFalseOrderByDateCreationDesc(email)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Aucun code n'a ete envoye a cet email."));

        if (verification.getExpiration().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Ce code a expire, veuillez en redemander un.");
        }
        if (!verification.getCode().equals(code)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Code de verification incorrect.");
        }
        verification.setUtilise(true);
        codeVerificationRepository.save(verification);
    }
}
