package dev.alro127.tasksense.domain.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

import jakarta.persistence.*;

@Entity
@Table(name = "user_skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSkillEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "skill_name", nullable = false)
    private String skillName;

    @Column(name = "level")
    private Integer level;
}
