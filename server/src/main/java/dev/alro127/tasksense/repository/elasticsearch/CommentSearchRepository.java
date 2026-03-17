package dev.alro127.tasksense.repository.elasticsearch;

import dev.alro127.tasksense.domain.document.CommentDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentSearchRepository extends ElasticsearchRepository<CommentDocument, Long> {

    Page<CommentDocument> findByTaskId(Long taskId, Pageable pageable);

    Page<CommentDocument> findByProjectId(Long projectId, Pageable pageable);

    void deleteByTaskId(Long taskId);

    void deleteByProjectId(Long projectId);
}
