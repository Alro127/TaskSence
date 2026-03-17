package dev.alro127.tasksense.repository.elasticsearch;

import dev.alro127.tasksense.domain.document.ProjectDocument;
import dev.alro127.tasksense.domain.enums.ProjectStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectSearchRepository extends ElasticsearchRepository<ProjectDocument, Long> {

    Page<ProjectDocument> findByWorkspaceId(Long workspaceId, Pageable pageable);

    Page<ProjectDocument> findByWorkspaceIdAndStatus(Long workspaceId, ProjectStatus status, Pageable pageable);

    void deleteByWorkspaceId(Long workspaceId);
}
