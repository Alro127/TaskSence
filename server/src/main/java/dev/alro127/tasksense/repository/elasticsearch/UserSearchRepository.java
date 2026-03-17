package dev.alro127.tasksense.repository.elasticsearch;

import dev.alro127.tasksense.domain.document.UserDocument;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserSearchRepository extends ElasticsearchRepository<UserDocument, Long> {

    Page<UserDocument> findByIsActive(Boolean isActive, Pageable pageable);
}
