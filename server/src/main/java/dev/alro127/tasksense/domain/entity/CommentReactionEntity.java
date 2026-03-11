package dev.alro127.tasksense.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "comment_reactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentReactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private CommentEntity comment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String icon;
}