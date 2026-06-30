package dev.alro127.tasksense.repository.jpa;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import dev.alro127.tasksense.domain.entity.SprintEntity;

import java.time.LocalDate;
import java.util.List;

public interface SprintRepository extends JpaRepository<SprintEntity, Long> {

  Page<SprintEntity> findByProjectId(Long projectId, Pageable pageable);

  @Query("""
          SELECT s FROM SprintEntity s
          JOIN FETCH s.project p
          JOIN FETCH p.workspace
          WHERE s.project.id IN :projectIds
            AND s.endDate >= :startDate
            AND s.endDate <= :endDate
            AND s.status IN ('ACTIVE', 'PLANNING')
          ORDER BY s.endDate ASC
      """)
  List<SprintEntity> findUpcomingByProjectIds(
      @Param("projectIds") List<Long> projectIds,
      @Param("startDate") LocalDate startDate,
      @Param("endDate") LocalDate endDate);

  List<SprintEntity> findAllByProjectIdOrderByStartDateAscIdAsc(Long projectId);

}
