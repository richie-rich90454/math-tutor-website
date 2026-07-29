package com.mathtutor.repository;

import com.mathtutor.domain.Message;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByChatSessionIdOrderByCreatedAtAsc(Long chatSessionId);

    long countByChatSessionId(Long chatSessionId);
}
