package bj.myaddictive.compte.repository;

import bj.myaddictive.compte.domain.CodeVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CodeVerificationRepository extends JpaRepository<CodeVerification, Long> {
    Optional<CodeVerification> findTopByEmailAndUtiliseFalseOrderByDateCreationDesc(String email);
}
