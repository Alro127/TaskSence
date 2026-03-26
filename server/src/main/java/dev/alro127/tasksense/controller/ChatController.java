package dev.alro127.tasksense.controller;

import dev.alro127.tasksense.dto.common.ApiResponse;
import dev.alro127.tasksense.dto.request.ChatMessageRequest;
import dev.alro127.tasksense.dto.response.ChatSessionResponse;
import dev.alro127.tasksense.service.ChatService;
import dev.alro127.tasksense.service.SecurityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SecurityService securityService;

    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<ChatSessionResponse>> createSession() {
        Long userId = securityService.getCurrentUserId();
        ChatSessionResponse session = chatService.createSession(userId);
        return ResponseEntity.ok(new ApiResponse<>("200", "Session created", session, null));
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<ChatSessionResponse>>> getSessions(
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "20") int limit
    ) {
        Long userId = securityService.getCurrentUserId();
        List<ChatSessionResponse> sessions = chatService.getSessions(userId, cursor, limit);
        return ResponseEntity.ok(new ApiResponse<>("200", "Sessions loaded", sessions, null));
    }

    @GetMapping("/sessions/{id}")
    public ResponseEntity<ApiResponse<ChatSessionResponse>> getSession(@PathVariable Long id) {
        Long userId = securityService.getCurrentUserId();
        ChatSessionResponse session = chatService.getSession(id, userId);
        return ResponseEntity.ok(new ApiResponse<>("200", "Session loaded", session, null));
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(@PathVariable Long id) {
        Long userId = securityService.getCurrentUserId();
        chatService.deleteSession(id, userId);
        return ResponseEntity.ok(new ApiResponse<>("200", "Session deleted", null, null));
    }

    @PostMapping(value = "/sessions/{id}/messages", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chat(@PathVariable Long id, @Valid @RequestBody ChatMessageRequest request) {
        Long userId = securityService.getCurrentUserId();
        SseEmitter emitter = new SseEmitter(600_000L); // 2 min timeout

        chatService.streamChat(id, userId, request)
                .subscribe(
                        chunk -> {
                            try {
                                emitter.send(SseEmitter.event().data(chunk));
                            } catch (Exception e) {
                                emitter.completeWithError(e);
                            }
                        },
                        emitter::completeWithError,
                        emitter::complete
                );

        return emitter;
    }
}
