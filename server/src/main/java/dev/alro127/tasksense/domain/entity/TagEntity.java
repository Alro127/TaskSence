package dev.alro127.tasksense.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tags", uniqueConstraints = {
                @UniqueConstraint(columnNames = { "project_id", "name" })
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted_at IS NULL")
public class TagEntity {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "project_id", nullable = false)
        private ProjectEntity project;

        @Column(nullable = false)
        private String name;

        private String color;

        @CreationTimestamp
        @Column(name = "created_at", updatable = false)
        private OffsetDateTime createdAt;

        @UpdateTimestamp
        @Column(name = "updated_at")
        private OffsetDateTime updatedAt;

        @Column(name = "deleted_at")
        private OffsetDateTime deletedAt;

        @ManyToMany(mappedBy = "tags")
        private Set<TaskEntity> tasks = new HashSet<>();
}