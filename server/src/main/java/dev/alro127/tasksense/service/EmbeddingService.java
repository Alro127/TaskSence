package dev.alro127.tasksense.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class EmbeddingService {

    private static final int MAX_TEXT_LENGTH = 2000;

    private final EmbeddingModel embeddingModel;

    @Autowired
    public EmbeddingService(Optional<EmbeddingModel> embeddingModel) {
        this.embeddingModel = embeddingModel.orElse(null);
        if (this.embeddingModel == null) {
            log.warn("EmbeddingModel bean not found — RAG vector search will be disabled. " +
                     "Check spring.ai.google.genai configuration.");
        }
    }

    public boolean isAvailable() {
        return embeddingModel != null;
    }

    /**
     * Embed một đoạn text thành vector.
     * Trả về null nếu embedding model không khả dụng hoặc embedding thất bại.
     */
    public float[] embed(String text) {
        if (embeddingModel == null || text == null || text.isBlank()) return null;
        try {
            String input = text.length() > MAX_TEXT_LENGTH ? text.substring(0, MAX_TEXT_LENGTH) : text;
            return embeddingModel.embed(input);
        } catch (Exception e) {
            log.warn("Embedding failed, document will be indexed without vector: {}", e.getMessage());
            return null;
        }
    }

    // ===== Text builders cho từng entity =====

    public String buildTaskText(String title, String description, String status,
                                String priority, String sprintName, String projectName,
                                List<String> assigneeNames, List<String> tagNames) {
        StringBuilder sb = new StringBuilder();
        sb.append("[Task] ").append(title != null ? title : "");
        if (description != null && !description.isBlank()) sb.append(". ").append(description);
        if (status != null) sb.append(". Status: ").append(status);
        if (priority != null) sb.append(". Priority: ").append(priority);
        if (projectName != null) sb.append(". Project: ").append(projectName);
        if (sprintName != null) sb.append(". Sprint: ").append(sprintName);
        if (assigneeNames != null && !assigneeNames.isEmpty())
            sb.append(". Assignees: ").append(String.join(", ", assigneeNames));
        if (tagNames != null && !tagNames.isEmpty())
            sb.append(". Tags: ").append(String.join(", ", tagNames));
        return sb.toString();
    }

    public String buildProjectText(String name, String description, String status) {
        StringBuilder sb = new StringBuilder();
        sb.append("[Project] ").append(name != null ? name : "");
        if (description != null && !description.isBlank()) sb.append(". ").append(description);
        if (status != null) sb.append(". Status: ").append(status);
        return sb.toString();
    }

    public String buildCommentText(String content, String taskTitle) {
        StringBuilder sb = new StringBuilder();
        if (taskTitle != null) sb.append("[Comment on task: ").append(taskTitle).append("] ");
        sb.append(content != null ? content : "");
        return sb.toString();
    }
}
