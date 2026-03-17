package dev.alro127.tasksense.repository.elasticsearch;

import dev.alro127.tasksense.domain.document.TaskDocument;
import dev.alro127.tasksense.domain.enums.TaskPriority;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskSearchRepository extends ElasticsearchRepository<TaskDocument, Long> {

    Page<TaskDocument> findByProjectId(Long projectId, Pageable pageable);

    Page<TaskDocument> findByProjectIdAndStatus(Long projectId, TaskStatus status, Pageable pageable);

    Page<TaskDocument> findByProjectIdAndPriority(Long projectId, TaskPriority priority, Pageable pageable);

    void deleteByProjectId(Long projectId);
}
