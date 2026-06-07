package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.alro127.tasksense.domain.entity.AttachmentEntity;

import java.util.List;

public interface AttachmentRepository extends JpaRepository<AttachmentEntity, Long> {

    List<AttachmentEntity> findByTaskId(Long taskId);

    List<AttachmentEntity> findByIdIn(List<Long> ids);

}
