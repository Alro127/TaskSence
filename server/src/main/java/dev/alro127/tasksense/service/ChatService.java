package dev.alro127.tasksense.service;

import dev.alro127.tasksense.dto.request.ChatMessageRequest;
import dev.alro127.tasksense.dto.response.ChatSessionResponse;
import reactor.core.publisher.Flux;

import java.util.List;

public interface ChatService {

    ChatSessionResponse createSession(Long userId);

    List<ChatSessionResponse> getSessions(Long userId, Long cursor, int limit);

    ChatSessionResponse getSession(Long sessionId, Long userId);

    void deleteSession(Long sessionId, Long userId);

    Flux<String> streamChat(Long sessionId, Long userId, ChatMessageRequest request);
}
