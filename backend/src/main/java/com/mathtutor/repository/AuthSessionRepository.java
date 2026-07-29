package com.mathtutor.repository;

import com.mathtutor.domain.AuthSession;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {

    Optional<AuthSession> findByToken(String token);

    void deleteByUserId(Long userId);
}
