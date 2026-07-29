package com.mathtutor.repository;

import com.mathtutor.domain.ChatSession;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    List<ChatSession> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<ChatSession> findByUserIdAndIsArchivedFalseOrderByCreatedAtDesc(Long userId);

    long countByUserId(Long userId);

    Optional<ChatSession> findByIdAndUserId(Long id, Long userId);
}
