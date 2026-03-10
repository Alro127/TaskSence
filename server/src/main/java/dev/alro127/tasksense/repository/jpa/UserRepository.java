package dev.alro127.tasksense.repository.jpa;

import io.lettuce.core.dynamic.annotation.Param;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import dev.alro127.tasksense.domain.entity.UserEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
                SELECT u FROM UserEntity u
                WHERE (:cursor IS NULL OR u.id < :cursor)
                  AND (
                        :keyword IS NULL OR
                        LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
                        LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
                      )
                ORDER BY u.id DESC
            """)
    List<UserEntity> searchUsers(
            @Param("keyword") String keyword,
            @Param("cursor") Long cursor,
            Pageable pageable);
}
