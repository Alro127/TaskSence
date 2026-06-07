package dev.alro127.tasksense.service.impl;

import co.elastic.clients.elasticsearch._types.aggregations.Aggregate;
import co.elastic.clients.elasticsearch._types.aggregations.Aggregation;
import co.elastic.clients.elasticsearch._types.aggregations.CalendarInterval;
import co.elastic.clients.elasticsearch._types.aggregations.FilterAggregate;
import co.elastic.clients.elasticsearch._types.aggregations.NestedAggregate;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Set;

import dev.alro127.tasksense.domain.document.*;
import dev.alro127.tasksense.domain.entity.*;
import dev.alro127.tasksense.dto.response.ProjectAnalyticsResponse;
import dev.alro127.tasksense.repository.elasticsearch.*;
import dev.alro127.tasksense.service.SearchIndexService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchAggregation;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchAggregations;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchIndexServiceImpl implements SearchIndexService {

    private final TaskSearchRepository taskSearchRepository;
    private final ProjectSearchRepository projectSearchRepository;
    private final CommentSearchRepository commentSearchRepository;
    private final UserSearchRepository userSearchRepository;
    private final ElasticsearchOperations elasticsearchOperations;

    // ===== Task =====

    @Override
    public void indexTask(TaskEntity task) {
        taskSearchRepository.save(toTaskDocument(task));
    }

    @Override
    public void indexTasks(List<TaskEntity> tasks) {
        taskSearchRepository.saveAll(tasks.stream().map(this::toTaskDocument).toList());
    }

    @Override
    public void removeTask(Long taskId) {
        taskSearchRepository.deleteById(taskId);
    }

    @Override
    public void removeTasksByProject(Long projectId) {
        taskSearchRepository.deleteByProjectId(projectId);
    }

    // ===== Project =====

    @Override
    public void indexProject(ProjectEntity project) {
        projectSearchRepository.save(toProjectDocument(project));
    }

    @Override
    public void indexProjects(List<ProjectEntity> projects) {
        projectSearchRepository.saveAll(projects.stream().map(this::toProjectDocument).toList());
    }

    @Override
    public void removeProject(Long projectId) {
        projectSearchRepository.deleteById(projectId);
    }

    @Override
    public void removeProjectsByWorkspace(Long workspaceId) {
        projectSearchRepository.deleteByWorkspaceId(workspaceId);
    }

    // ===== Comment =====

    @Override
    public void indexComment(CommentEntity comment) {
        commentSearchRepository.save(toCommentDocument(comment));
    }

    @Override
    public void indexComments(List<CommentEntity> comments) {
        commentSearchRepository.saveAll(comments.stream().map(this::toCommentDocument).toList());
    }

    @Override
    public void removeComment(Long commentId) {
        commentSearchRepository.deleteById(commentId);
    }

    @Override
    public void removeCommentsByTask(Long taskId) {
        commentSearchRepository.deleteByTaskId(taskId);
    }

    @Override
    public void removeCommentsByProject(Long projectId) {
        commentSearchRepository.deleteByProjectId(projectId);
    }

    // ===== User =====

    @Override
    public void indexUser(UserEntity user) {
        userSearchRepository.save(toUserDocument(user));
    }

    @Override
    public void indexUsers(List<UserEntity> users) {
        userSearchRepository.saveAll(users.stream().map(this::toUserDocument).toList());
    }

    @Override
    public void removeUser(Long userId) {
        userSearchRepository.deleteById(userId);
    }

    // ===== Analytics =====

    @Override
    public ProjectAnalyticsResponse getProjectAnalytics(Long projectId) {
        String now = OffsetDateTime.now().toString();
        String thirtyDaysAgo = OffsetDateTime.now().minusDays(30).toString();

        NativeQuery query = NativeQuery.builder()
                .withQuery(q -> q.term(t -> t.field("projectId").value(projectId)))

                // Phân bố status
                .withAggregation("status_dist", Aggregation.of(a -> a
                        .terms(t -> t.field("status").size(10))))

                // Phân bố priority
                .withAggregation("priority_dist", Aggregation.of(a -> a
                        .terms(t -> t.field("priority").size(10))))

                // Task quá hạn: dueDate < now AND status != DONE
                .withAggregation("overdue", Aggregation.of(a -> a
                        .filter(f -> f.bool(b -> b
                                .must(m -> m.range(r -> r.date(d -> d.field("dueDate").lt(now))))
                                .mustNot(mn -> mn.term(t -> t.field("status").value("DONE")))))))

                // Trend hoàn thành 30 ngày: filter(completedAt >= 30d ago) → date_histogram/day
                .withAggregation("completion_trend", Aggregation.of(a -> a
                        .filter(f -> f.range(r -> r.date(d -> d.field("completedAt").gte(thirtyDaysAgo))))
                        .aggregations("by_day", Aggregation.of(a2 -> a2
                                .dateHistogram(dh -> dh
                                        .field("completedAt")
                                        .calendarInterval(CalendarInterval.Day)
                                        .format("yyyy-MM-dd"))))))

                // Tổng task assigned theo member: nested(assignees) → terms(assignees.id)
                .withAggregation("member_total", Aggregation.of(a -> a
                        .nested(n -> n.path("assignees"))
                        .aggregations("by_user", Aggregation.of(a2 -> a2
                                .terms(t -> t.field("assignees.id").size(100))))))

                // Task DONE theo member: filter(DONE) → nested → terms
                .withAggregation("member_done", Aggregation.of(a -> a
                        .filter(f -> f.term(t -> t.field("status").value("DONE")))
                        .aggregations("nested_users", Aggregation.of(a2 -> a2
                                .nested(n -> n.path("assignees"))
                                .aggregations("by_user", Aggregation.of(a3 -> a3
                                        .terms(t -> t.field("assignees.id").size(100))))))))

                // Task overdue theo member: filter(overdue) → nested → terms
                .withAggregation("member_overdue", Aggregation.of(a -> a
                        .filter(f -> f.bool(b -> b
                                .must(m -> m.range(r -> r.date(d -> d.field("dueDate").lt(now))))
                                .mustNot(mn -> mn.term(t -> t.field("status").value("DONE")))))
                        .aggregations("nested_users", Aggregation.of(a2 -> a2
                                .nested(n -> n.path("assignees"))
                                .aggregations("by_user", Aggregation.of(a3 -> a3
                                        .terms(t -> t.field("assignees.id").size(100))))))))

                // Velocity theo sprint: filter(DONE + sprintId exists) → terms(sprintId)
                .withAggregation("sprint_velocity", Aggregation.of(a -> a
                        .filter(f -> f.bool(b -> b
                                .must(m -> m.term(t -> t.field("status").value("DONE")))
                                .must(m -> m.exists(e -> e.field("sprintId")))))
                        .aggregations("by_sprint", Aggregation.of(a2 -> a2
                                .terms(t -> t.field("sprintId").size(20))))))

                .withMaxResults(0)
                .build();

        SearchHits<TaskDocument> hits = elasticsearchOperations.search(query, TaskDocument.class);
        long totalTasks = hits.getTotalHits();

        Map<String, Long> statusDistribution = new LinkedHashMap<>();
        Map<String, Long> priorityDistribution = new LinkedHashMap<>();
        List<ProjectAnalyticsResponse.DayCount> completionTrend = new ArrayList<>();
        List<ProjectAnalyticsResponse.SprintVelocity> sprintVelocity = new ArrayList<>();
        Map<Long, Long> memberTotalMap = new HashMap<>();
        Map<Long, Long> memberDoneMap = new HashMap<>();
        Map<Long, Long> memberOverdueMap = new HashMap<>();
        long overdueCount = 0;

        try {
            ElasticsearchAggregations aggs = (ElasticsearchAggregations) hits.getAggregations();
            if (aggs != null) {

                // --- Status distribution ---
                ElasticsearchAggregation statusAggEl = aggs.get("status_dist");
                if (statusAggEl != null) {
                    statusAggEl.aggregation().getAggregate().sterms().buckets().array()
                            .forEach(b -> statusDistribution.put(b.key().stringValue(), b.docCount()));
                }

                // --- Priority distribution ---
                ElasticsearchAggregation priorityAggEl = aggs.get("priority_dist");
                if (priorityAggEl != null) {
                    priorityAggEl.aggregation().getAggregate().sterms().buckets().array()
                            .forEach(b -> priorityDistribution.put(b.key().stringValue(), b.docCount()));
                }

                // --- Overdue count ---
                ElasticsearchAggregation overdueAggEl = aggs.get("overdue");
                if (overdueAggEl != null) {
                    overdueCount = overdueAggEl.aggregation().getAggregate().filter().docCount();
                }

                // --- Completion trend: filter → by_day ---
                ElasticsearchAggregation trendAggEl = aggs.get("completion_trend");
                if (trendAggEl != null) {
                    FilterAggregate trendFilter = trendAggEl.aggregation().getAggregate().filter();
                    Aggregate byDayAgg = trendFilter.aggregations().get("by_day");
                    if (byDayAgg != null) {
                        byDayAgg.dateHistogram().buckets().array()
                                .forEach(b -> completionTrend.add(
                                        new ProjectAnalyticsResponse.DayCount(b.keyAsString(), b.docCount())));
                    }
                }

                // --- Member total: nested → by_user ---
                ElasticsearchAggregation memberTotalEl = aggs.get("member_total");
                if (memberTotalEl != null) {
                    NestedAggregate nested = memberTotalEl.aggregation().getAggregate().nested();
                    Aggregate byUser = nested.aggregations().get("by_user");
                    if (byUser != null) {
                        byUser.lterms().buckets().array()
                                .forEach(b -> memberTotalMap.put(b.key(), b.docCount()));
                    }
                }

                // --- Member done: filter → nested_users → by_user ---
                ElasticsearchAggregation memberDoneEl = aggs.get("member_done");
                if (memberDoneEl != null) {
                    FilterAggregate doneFilter = memberDoneEl.aggregation().getAggregate().filter();
                    Aggregate nestedAgg = doneFilter.aggregations().get("nested_users");
                    if (nestedAgg != null) {
                        Aggregate byUser = nestedAgg.nested().aggregations().get("by_user");
                        if (byUser != null) {
                            byUser.lterms().buckets().array()
                                    .forEach(b -> memberDoneMap.put(b.key(), b.docCount()));
                        }
                    }
                }

                // --- Member overdue: filter → nested_users → by_user ---
                ElasticsearchAggregation memberOverdueEl = aggs.get("member_overdue");
                if (memberOverdueEl != null) {
                    FilterAggregate overdueFilter = memberOverdueEl.aggregation().getAggregate().filter();
                    Aggregate nestedAgg = overdueFilter.aggregations().get("nested_users");
                    if (nestedAgg != null) {
                        Aggregate byUser = nestedAgg.nested().aggregations().get("by_user");
                        if (byUser != null) {
                            byUser.lterms().buckets().array()
                                    .forEach(b -> memberOverdueMap.put(b.key(), b.docCount()));
                        }
                    }
                }

                // --- Sprint velocity: filter → by_sprint ---
                ElasticsearchAggregation sprintVelocityEl = aggs.get("sprint_velocity");
                if (sprintVelocityEl != null) {
                    FilterAggregate sprintFilter = sprintVelocityEl.aggregation().getAggregate().filter();
                    Aggregate bySprintAgg = sprintFilter.aggregations().get("by_sprint");
                    if (bySprintAgg != null) {
                        bySprintAgg.lterms().buckets().array()
                                .forEach(b -> sprintVelocity.add(
                                        new ProjectAnalyticsResponse.SprintVelocity(b.key(), b.docCount())));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse analytics aggregations for project {}: {}", projectId, e.getMessage());
        }

        // ── Tổng hợp MemberPerformance ──────────────────────────────────────
        Set<Long> allUserIds = new HashSet<>(memberTotalMap.keySet());
        allUserIds.addAll(memberDoneMap.keySet());
        allUserIds.addAll(memberOverdueMap.keySet());

        List<ProjectAnalyticsResponse.MemberPerformance> memberPerformance = allUserIds.stream()
                .map(userId -> {
                    long assigned = memberTotalMap.getOrDefault(userId, 0L);
                    long completed = memberDoneMap.getOrDefault(userId, 0L);
                    long overdue = memberOverdueMap.getOrDefault(userId, 0L);
                    return new ProjectAnalyticsResponse.MemberPerformance(
                            userId, assigned, completed, overdue, computeMemberScore(assigned, completed, overdue));
                })
                .sorted(Comparator.comparingInt(ProjectAnalyticsResponse.MemberPerformance::getPerformanceScore)
                        .reversed())
                .toList();

        // ── Derived metrics ─────────────────────────────────────────────────
        long doneCount = statusDistribution.getOrDefault("DONE", 0L);
        long totalCompleted30d = completionTrend.stream().mapToLong(ProjectAnalyticsResponse.DayCount::getCount).sum();
        double avgDailyVelocity = totalCompleted30d / 30.0;
        long remaining = totalTasks - doneCount;

        String projectedCompletionDate = null;
        if (remaining <= 0) {
            projectedCompletionDate = LocalDate.now().toString();
        } else if (avgDailyVelocity > 0) {
            long daysNeeded = (long) Math.ceil(remaining / avgDailyVelocity);
            projectedCompletionDate = LocalDate.now().plusDays(daysNeeded).toString();
        }

        int healthScore = computeHealthScore(totalTasks, doneCount, overdueCount);

        return ProjectAnalyticsResponse.builder()
                .totalTasks(totalTasks)
                .statusDistribution(statusDistribution)
                .priorityDistribution(priorityDistribution)
                .overdueCount(overdueCount)
                .completionTrend(completionTrend)
                .healthScore(healthScore)
                .projectedCompletionDate(projectedCompletionDate)
                .avgDailyVelocity(avgDailyVelocity)
                .sprintVelocity(sprintVelocity)
                .memberPerformance(memberPerformance)
                .build();
    }

    private int computeHealthScore(long totalTasks, long doneCount, long overdueCount) {
        if (totalTasks == 0)
            return 100;
        double completionRate = (double) doneCount / totalTasks * 100;
        double onTimeRate = (1.0 - (double) overdueCount / totalTasks) * 100;
        return (int) Math.round(completionRate * 0.6 + onTimeRate * 0.4);
    }

    private int computeMemberScore(long assigned, long completed, long overdue) {
        if (assigned == 0)
            return 100;
        double completionRate = (double) completed / assigned;
        double onTimeRate = Math.max(0.0, 1.0 - (double) overdue / assigned);
        return (int) Math.round((completionRate * 0.6 + onTimeRate * 0.4) * 100);
    }

    // ===== Mappers =====

    private TaskDocument toTaskDocument(TaskEntity task) {
        List<UserRef> assignees = task.getAssignees().stream()
                .map(u -> UserRef.builder()
                        .id(u.getId())
                        .fullName(u.getFullName())
                        .avatarUrl(u.getAvatarUrl())
                        .build())
                .toList();

        List<String> tagNames = task.getTags().stream()
                .map(TagEntity::getName)
                .toList();

        return TaskDocument.builder()
                .id(task.getId())
                .projectId(task.getProject().getId())
                .projectName(task.getProject().getName())
                .workspaceId(task.getProject().getWorkspace().getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .priority(task.getPriority())
                .parentTaskId(task.getParentTask() != null ? task.getParentTask().getId() : null)
                .sprintId(task.getSprint() != null ? task.getSprint().getId() : null)
                .sprintName(task.getSprint() != null ? task.getSprint().getName() : null)
                .createdById(task.getCreatedBy().getId())
                .createdByName(task.getCreatedBy().getFullName())
                .assignees(assignees)
                .tagNames(tagNames)
                .startDate(task.getStartDate())
                .dueDate(task.getDueDate())
                .completedAt(task.getCompletedAt())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }

    private ProjectDocument toProjectDocument(ProjectEntity project) {
        return ProjectDocument.builder()
                .id(project.getId())
                .workspaceId(project.getWorkspace().getId())
                .workspaceName(project.getWorkspace().getName())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private CommentDocument toCommentDocument(CommentEntity comment) {
        return CommentDocument.builder()
                .id(comment.getId())
                .taskId(comment.getTask().getId())
                .taskTitle(comment.getTask().getTitle())
                .projectId(comment.getTask().getProject().getId())
                .workspaceId(comment.getTask().getProject().getWorkspace().getId())
                .userId(comment.getUser().getId())
                .userFullName(comment.getUser().getFullName())
                .content(comment.getContent())
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .isEdited(comment.getIsEdited())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }

    private UserDocument toUserDocument(UserEntity user) {
        return UserDocument.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .isActive(user.getIsActive())
                .avatarUrl(user.getAvatarUrl())
                .phone(user.getPhone())
                .gender(user.getGender())
                .dob(user.getDob())
                .bio(user.getBio())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
