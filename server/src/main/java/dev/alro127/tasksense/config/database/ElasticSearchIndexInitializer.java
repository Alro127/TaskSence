package dev.alro127.tasksense.config.database;

import dev.alro127.tasksense.domain.document.CommentDocument;
import dev.alro127.tasksense.domain.document.ProjectDocument;
import dev.alro127.tasksense.domain.document.TaskDocument;
import dev.alro127.tasksense.domain.document.UserDocument;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.IndexOperations;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ElasticSearchIndexInitializer {

    private final ElasticsearchOperations operations;

    @PostConstruct
    public void createIndices() {
        createIfAbsent(TaskDocument.class);
        createIfAbsent(ProjectDocument.class);
        createIfAbsent(CommentDocument.class);
        createIfAbsent(UserDocument.class);
    }

    private void createIfAbsent(Class<?> documentClass) {
        try {
            IndexOperations indexOps = operations.indexOps(documentClass);
            if (!indexOps.exists()) {
                indexOps.createWithMapping();
                log.info("Created ES index for {}", documentClass.getSimpleName());
            }
        } catch (Exception e) {
            log.warn("Could not create ES index for {} — ES may be unavailable: {}",
                    documentClass.getSimpleName(), e.getMessage());
        }
    }
}
