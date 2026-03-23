package dev.alro127.tasksense.service.impl;

import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch._types.query_dsl.TermsQueryField;
import dev.alro127.tasksense.domain.entity.ChatMessageEntity;
import dev.alro127.tasksense.domain.entity.ChatSessionEntity;
import dev.alro127.tasksense.domain.entity.UserEntity;
import dev.alro127.tasksense.domain.enums.ChatRole;
import dev.alro127.tasksense.domain.document.CommentDocument;
import dev.alro127.tasksense.domain.document.ProjectDocument;
import dev.alro127.tasksense.domain.document.TaskDocument;
import dev.alro127.tasksense.dto.request.ChatMessageRequest;
import dev.alro127.tasksense.dto.response.ChatMessageResponse;
import dev.alro127.tasksense.dto.response.ChatSessionResponse;
import dev.alro127.tasksense.dto.response.ChatSourceItem;
import dev.alro127.tasksense.repository.jpa.ChatMessageRepository;
import dev.alro127.tasksense.repository.jpa.ChatSessionRepository;
import dev.alro127.tasksense.repository.jpa.UserRepository;
import dev.alro127.tasksense.repository.jpa.WorkspaceMemberRepository;
import dev.alro127.tasksense.service.ChatService;
import dev.alro127.tasksense.service.EmbeddingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private static final int HISTORY_SIZE = 10;
    private static final int KNN_K = 5;
    private static final int KNN_CANDIDATES = 50;

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final EmbeddingService embeddingService;
    private final ElasticsearchOperations elasticsearchOperations;
    private final ChatModel chatModel;

    // ===== Session management =====

    @Override
    @Transactional
    public ChatSessionResponse createSession(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        ChatSessionEntity session = ChatSessionEntity.builder()
                .user(user)
                .build();

        chatSessionRepository.save(session);
        return toSessionResponse(session);
    }

    @Override
    public List<ChatSessionResponse> getSessions(Long userId, Long cursor, int limit) {
        return chatSessionRepository
                .findSessionsByUser(userId, cursor, PageRequest.of(0, limit))
                .stream()
                .map(this::toSessionResponseWithoutMessages)
                .toList();
    }

    @Override
    public ChatSessionResponse getSession(Long sessionId, Long userId) {
        ChatSessionEntity session = chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        List<ChatMessageEntity> messages = chatMessageRepository.findBySessionId(sessionId);
        return toSessionResponseWithMessages(session, messages);
    }

    @Override
    @Transactional
    public void deleteSession(Long sessionId, Long userId) {
        int deleted = chatSessionRepository.softDeleteByIdAndUserId(sessionId, userId);
        if (deleted == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found");
        }
    }

    // ===== RAG Chat =====

    @Override
    public Flux<String> streamChat(Long sessionId, Long userId, ChatMessageRequest request) {
        // 1. Validate session ownership
        ChatSessionEntity session = chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));

        UserEntity user = session.getUser();

        // 2. Save user message
        Map<String, Object> contextMap = buildContextMap(request.getContext());
        ChatMessageEntity userMessage = ChatMessageEntity.builder()
                .session(session)
                .role(ChatRole.USER)
                .content(request.getContent())
                .context(contextMap)
                .build();
        chatMessageRepository.save(userMessage);

        // 3. Determine scope for retrieval
        List<Long> workspaceIds = resolveWorkspaceIds(userId, request.getContext());
        Long projectId = request.getContext() != null ? request.getContext().getProjectId() : null;

        // 4. Embed query and retrieve context
        float[] queryVector = embeddingService.embed(request.getContent());
        List<ChatSourceItem> sources = new ArrayList<>();
        String ragContext = "";

        if (queryVector != null && queryVector.length > 0 && !workspaceIds.isEmpty()) {
            ragContext = retrieveContext(queryVector, workspaceIds, projectId, sources);
        }

        // 5. Build conversation history (exclude the user message we just saved to avoid duplicates)
        List<ChatMessageEntity> history = chatMessageRepository.findRecentBySessionId(sessionId, HISTORY_SIZE + 1);
        // findRecentBySessionId returns DESC order, reverse to chronological, then drop the last entry
        // (the user message we just saved — it is added explicitly to the prompt below)
        List<ChatMessageEntity> chronological = history.reversed();
        if (!chronological.isEmpty()
                && chronological.get(chronological.size() - 1).getId().equals(userMessage.getId())) {
            chronological = chronological.subList(0, chronological.size() - 1);
        }

        // 6. Build prompt
        Prompt prompt = buildPrompt(request.getContent(), ragContext, chronological, user.getFullName());

        // 7. Stream response and save assistant message on completion
        AtomicReference<StringBuilder> fullResponse = new AtomicReference<>(new StringBuilder());
        String autoTitle = session.getTitle() == null ? request.getContent() : null;

        Flux<String> streamingFlux = chatModel.stream(prompt)
                .mapNotNull(response -> {
                    if (response.getResult() != null && response.getResult().getOutput() != null) {
                        return response.getResult().getOutput().getText();
                    }
                    return null;
                })
                .filter(chunk -> chunk != null && !chunk.isEmpty());

        Flux<String> fallbackFlux = Mono.fromCallable(() -> {
                    log.info("Using non-streaming fallback for session {}", sessionId);
                    ChatResponse resp = chatModel.call(prompt);
                    return resp.getResult().getOutput().getText();
                })
                .subscribeOn(Schedulers.boundedElastic())
                .flux();

        return streamingFlux
                .onErrorResume(e -> {
                    log.warn("Streaming failed for session {}, falling back to call(): {}", sessionId, e.getMessage());
                    return fallbackFlux;
                })
                .doOnNext(chunk -> fullResponse.get().append(chunk))
                .doOnComplete(() -> {
                    if (!fullResponse.get().isEmpty()) {
                        saveAssistantMessage(session, fullResponse.get().toString(), sources, autoTitle);
                    }
                })
                .onErrorResume(e -> {
                    log.error("Chat error for session {}", sessionId, e);
                    String msg = isQuotaError(e)
                            ? "⚠️ Gemini API quota exceeded. Please wait a moment and try again."
                            : "Sorry, I encountered an error generating a response. Please try again.";
                    saveAssistantMessage(session, msg, List.of(), autoTitle);
                    return Flux.just(msg);
                });
    }

    // ===== RAG Retrieval =====

    private String retrieveContext(float[] queryVector, List<Long> workspaceIds, Long projectId,
                                   List<ChatSourceItem> sources) {
        StringBuilder context = new StringBuilder();

        Query workspaceFilter = Query.of(q -> q
                .terms(t -> t.field("workspaceId")
                        .terms(TermsQueryField.of(tf -> tf.value(
                                workspaceIds.stream()
                                        .map(co.elastic.clients.elasticsearch._types.FieldValue::of)
                                        .toList()
                        )))));

        Query effectiveFilter = projectId != null
                ? Query.of(q -> q.bool(b -> b
                        .must(workspaceFilter)
                        .must(m -> m.term(t -> t.field("projectId").value(projectId)))))
                : workspaceFilter;

        // Retrieve tasks
        List<TaskDocument> tasks = knnSearch(queryVector, effectiveFilter, TaskDocument.class);
        if (!tasks.isEmpty()) {
            context.append("## Relevant Tasks\n");
            for (TaskDocument task : tasks) {
                context.append(formatTask(task)).append("\n");
                sources.add(ChatSourceItem.builder()
                        .type("TASK").id(task.getId()).title(task.getTitle())
                        .projectId(task.getProjectId()).projectName(task.getProjectName())
                        .build());
            }
        }

        // Retrieve projects (only if no specific project context)
        if (projectId == null) {
            List<ProjectDocument> projects = knnSearch(queryVector, workspaceFilter, ProjectDocument.class);
            if (!projects.isEmpty()) {
                context.append("\n## Relevant Projects\n");
                for (ProjectDocument project : projects) {
                    context.append(formatProject(project)).append("\n");
                    sources.add(ChatSourceItem.builder()
                            .type("PROJECT").id(project.getId()).title(project.getName())
                            .build());
                }
            }
        }

        // Retrieve comments
        List<CommentDocument> comments = knnSearch(queryVector, effectiveFilter, CommentDocument.class);
        if (!comments.isEmpty()) {
            context.append("\n## Relevant Comments\n");
            for (CommentDocument comment : comments) {
                context.append(formatComment(comment)).append("\n");
            }
        }

        return context.toString();
    }

    private <T> List<T> knnSearch(float[] queryVector, Query filter, Class<T> docClass) {
        try {
            List<Float> vector = toFloatList(queryVector);
            NativeQuery query = NativeQuery.builder()
                    .withQuery(q -> q.knn(k -> k
                            .field("embedding")
                            .queryVector(vector)
                            .numCandidates(KNN_CANDIDATES)
                            .filter(filter)
                    ))
                    .withMaxResults(KNN_K)
                    .build();

            return elasticsearchOperations.search(query, docClass)
                    .getSearchHits()
                    .stream()
                    .map(SearchHit::getContent)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("KNN search failed for {}: {}", docClass.getSimpleName(), e.getMessage());
            return List.of();
        }
    }

    // ===== Prompt building =====

    private Prompt buildPrompt(String userQuery, String ragContext,
                                List<ChatMessageEntity> history, String userName) {
        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();

        String systemContent = buildSystemPrompt(ragContext, userName);
        messages.add(new SystemMessage(systemContent));

        // Add conversation history (skip the last user message we just saved)
        for (ChatMessageEntity msg : history) {
            if (msg.getRole() == ChatRole.USER) {
                messages.add(new UserMessage(msg.getContent()));
            } else {
                messages.add(new AssistantMessage(msg.getContent()));
            }
        }

        messages.add(new UserMessage(userQuery));
        return new Prompt(messages);
    }

    private String buildSystemPrompt(String ragContext, String userName) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are TaskSense Assistant, a helpful AI assistant for a project management platform.\n");
        sb.append("You help users understand their tasks, projects, sprints, and team workload.\n");
        sb.append("Always be concise and professional. Support both Vietnamese and English — respond in the same language the user writes in.\n");
        sb.append("When referencing a task or project, mention its name clearly.\n");
        sb.append("If the provided context does not contain the answer, say so honestly.\n\n");
        sb.append("Current date: ").append(LocalDate.now()).append("\n");
        sb.append("Current user: ").append(userName).append("\n");

        if (!ragContext.isBlank()) {
            sb.append("\n--- Context from TaskSense ---\n");
            sb.append(ragContext);
            sb.append("--- End of context ---\n");
        }

        return sb.toString();
    }

    // ===== Helpers =====

    private List<Long> resolveWorkspaceIds(Long userId, ChatMessageRequest.ChatContext context) {
        if (context != null && context.getWorkspaceId() != null) {
            return List.of(context.getWorkspaceId());
        }
        return workspaceMemberRepository.findWorkspaceIdsByUserId(userId);
    }

    @Transactional
    protected void saveAssistantMessage(ChatSessionEntity session, String content,
                                        List<ChatSourceItem> sources, String autoTitle) {
        try {
            List<Map<String, Object>> sourceMaps = sources.stream()
                    .map(s -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("type", s.getType());
                        map.put("id", s.getId());
                        map.put("title", s.getTitle());
                        if (s.getProjectId() != null) map.put("projectId", s.getProjectId());
                        if (s.getProjectName() != null) map.put("projectName", s.getProjectName());
                        return map;
                    })
                    .toList();

            ChatMessageEntity assistantMessage = ChatMessageEntity.builder()
                    .session(session)
                    .role(ChatRole.ASSISTANT)
                    .content(content)
                    .sources(sourceMaps.isEmpty() ? null : sourceMaps)
                    .build();
            chatMessageRepository.save(assistantMessage);

            // Auto-generate session title from first user message (truncate to 50 chars)
            if (autoTitle != null && session.getTitle() == null) {
                session.setTitle(autoTitle.length() > 50 ? autoTitle.substring(0, 50) + "…" : autoTitle);
                chatSessionRepository.save(session);
            }
        } catch (Exception e) {
            log.error("Failed to save assistant message for session {}", session.getId(), e);
        }
    }

    private Map<String, Object> buildContextMap(ChatMessageRequest.ChatContext context) {
        if (context == null) return null;
        Map<String, Object> map = new HashMap<>();
        if (context.getWorkspaceId() != null) map.put("workspaceId", context.getWorkspaceId());
        if (context.getProjectId() != null) map.put("projectId", context.getProjectId());
        return map.isEmpty() ? null : map;
    }

    private boolean isQuotaError(Throwable e) {
        String msg = e.getMessage();
        return msg != null && (msg.contains("429") || msg.contains("quota") || msg.contains("RESOURCE_EXHAUSTED"));
    }

    private List<Float> toFloatList(float[] vector) {
        List<Float> result = new ArrayList<>(vector.length);
        for (float v : vector) result.add(v);
        return result;
    }

    // ===== Formatters for RAG context =====

    private String formatTask(TaskDocument task) {
        StringBuilder sb = new StringBuilder();
        sb.append("- Task [ID:").append(task.getId()).append("] \"").append(task.getTitle()).append("\"");
        sb.append(" | Status: ").append(task.getStatus());
        if (task.getPriority() != null) sb.append(" | Priority: ").append(task.getPriority());
        if (task.getProjectName() != null) sb.append(" | Project: ").append(task.getProjectName());
        if (task.getSprintName() != null) sb.append(" | Sprint: ").append(task.getSprintName());
        if (task.getDueDate() != null) sb.append(" | Due: ").append(task.getDueDate().toLocalDate());
        if (task.getAssignees() != null && !task.getAssignees().isEmpty()) {
            String names = task.getAssignees().stream()
                    .map(a -> a.getFullName())
                    .collect(Collectors.joining(", "));
            sb.append(" | Assignees: ").append(names);
        }
        if (task.getDescription() != null && !task.getDescription().isBlank()) {
            String desc = task.getDescription().length() > 200
                    ? task.getDescription().substring(0, 200) + "..."
                    : task.getDescription();
            sb.append("\n  Description: ").append(desc);
        }
        return sb.toString();
    }

    private String formatProject(ProjectDocument project) {
        StringBuilder sb = new StringBuilder();
        sb.append("- Project [ID:").append(project.getId()).append("] \"").append(project.getName()).append("\"");
        sb.append(" | Status: ").append(project.getStatus());
        if (project.getEndDate() != null) sb.append(" | End: ").append(project.getEndDate());
        if (project.getDescription() != null && !project.getDescription().isBlank()) {
            sb.append(" | Desc: ").append(project.getDescription());
        }
        return sb.toString();
    }

    private String formatComment(CommentDocument comment) {
        return "- Comment on task \"" + comment.getTaskTitle() + "\" by " + comment.getUserFullName()
                + ": " + comment.getContent();
    }

    // ===== Mappers =====

    private ChatSessionResponse toSessionResponse(ChatSessionEntity session) {
        return ChatSessionResponse.builder()
                .id(session.getId())
                .title(session.getTitle())
                .messages(List.of())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }

    private ChatSessionResponse toSessionResponseWithoutMessages(ChatSessionEntity session) {
        return ChatSessionResponse.builder()
                .id(session.getId())
                .title(session.getTitle())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }

    private ChatSessionResponse toSessionResponseWithMessages(ChatSessionEntity session,
                                                               List<ChatMessageEntity> messages) {
        List<ChatMessageResponse> messageResponses = messages.stream()
                .map(this::toMessageResponse)
                .toList();

        return ChatSessionResponse.builder()
                .id(session.getId())
                .title(session.getTitle())
                .messages(messageResponses)
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }

    @SuppressWarnings("unchecked")
    private ChatMessageResponse toMessageResponse(ChatMessageEntity msg) {
        List<ChatSourceItem> sources = null;
        if (msg.getSources() != null) {
            sources = msg.getSources().stream()
                    .map(s -> ChatSourceItem.builder()
                            .type((String) s.get("type"))
                            .id(s.get("id") instanceof Number n ? n.longValue() : null)
                            .title((String) s.get("title"))
                            .projectId(s.get("projectId") instanceof Number n ? n.longValue() : null)
                            .projectName((String) s.get("projectName"))
                            .build())
                    .toList();
        }

        return ChatMessageResponse.builder()
                .id(msg.getId())
                .role(msg.getRole())
                .content(msg.getContent())
                .sources(sources)
                .createdAt(msg.getCreatedAt())
                .build();
    }
}
