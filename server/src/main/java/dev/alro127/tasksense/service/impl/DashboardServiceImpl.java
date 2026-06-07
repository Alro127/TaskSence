package dev.alro127.tasksense.service.impl;

import dev.alro127.tasksense.domain.entity.ProjectEntity;
import dev.alro127.tasksense.domain.entity.TaskEntity;
import dev.alro127.tasksense.domain.enums.ProjectStatus;
import dev.alro127.tasksense.domain.enums.TaskStatus;
import dev.alro127.tasksense.dto.common.PageResponse;
import dev.alro127.tasksense.dto.response.DeadlineItem;
import dev.alro127.tasksense.dto.response.DashboardProjectItem;
import dev.alro127.tasksense.dto.response.DashboardSummaryResponse;
import dev.alro127.tasksense.dto.response.DashboardTaskItem;
import dev.alro127.tasksense.repository.jpa.ProjectMemberRepository;
import dev.alro127.tasksense.repository.jpa.SprintRepository;
import dev.alro127.tasksense.repository.jpa.TaskRepository;
import dev.alro127.tasksense.service.DashboardService;
import dev.alro127.tasksense.service.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

        private final SecurityService securityService;
        private final TaskRepository taskRepository;
        private final ProjectMemberRepository projectMemberRepository;
        private final SprintRepository sprintRepository;

        @Override
        public DashboardSummaryResponse getSummary() {
                Long userId = securityService.getCurrentUserId();
                OffsetDateTime now = OffsetDateTime.now();

                long totalTasks = taskRepository.countAssignedToUser(userId);
                long completedTasks = taskRepository.countCompletedAssignedToUser(userId);
                long overdueTasks = taskRepository.countOverdueAssignedToUser(userId, now);

                long activeProjects = projectMemberRepository.findProjectsByUserId(userId).stream()
                                .filter(p -> p.getStatus() == ProjectStatus.ACTIVE)
                                .count();

                return DashboardSummaryResponse.builder()
                                .totalTasks(totalTasks)
                                .completedTasks(completedTasks)
                                .overdueTasks(overdueTasks)
                                .activeProjects(activeProjects)
                                .build();
        }

        @Override
        public List<DashboardProjectItem> getActiveProjects() {
                Long userId = securityService.getCurrentUserId();
                OffsetDateTime now = OffsetDateTime.now();

                List<ProjectEntity> projects = projectMemberRepository.findProjectsByUserId(userId).stream()
                                .filter(p -> p.getStatus() != ProjectStatus.ARCHIVED)
                                .toList();

                if (projects.isEmpty())
                        return List.of();

                List<Long> projectIds = projects.stream().map(ProjectEntity::getId).toList();

                // Batch fetch: total tasks per project
                Map<Long, Long> totalTaskMap = taskRepository.countByProjectIds(projectIds).stream()
                                .collect(Collectors.toMap(
                                                row -> ((Number) row[0]).longValue(),
                                                row -> ((Number) row[1]).longValue()));

                // Batch fetch: done tasks per project
                Map<Long, Long> doneTaskMap = taskRepository.countDoneByProjectIds(projectIds, TaskStatus.DONE).stream()
                                .collect(Collectors.toMap(
                                                row -> ((Number) row[0]).longValue(),
                                                row -> ((Number) row[1]).longValue()));

                // Batch fetch: overdue tasks per project
                Map<Long, Long> overdueMap = taskRepository.countOverdueByProjectIds(projectIds, now).stream()
                                .collect(Collectors.toMap(
                                                row -> ((Number) row[0]).longValue(),
                                                row -> ((Number) row[1]).longValue()));

                // Batch fetch: member count per project
                Map<Long, Long> memberMap = projectMemberRepository.countMembersByProjectIds(projectIds).stream()
                                .collect(Collectors.toMap(
                                                row -> ((Number) row[0]).longValue(),
                                                row -> ((Number) row[1]).longValue()));

                return projects.stream().map(p -> {
                        long total = totalTaskMap.getOrDefault(p.getId(), 0L);
                        long done = doneTaskMap.getOrDefault(p.getId(), 0L);
                        double progress = total > 0 ? (done * 100.0 / total) : 0.0;

                        return DashboardProjectItem.builder()
                                        .id(p.getId())
                                        .workspaceId(p.getWorkspace().getId())
                                        .name(p.getName())
                                        .workspaceName(p.getWorkspace().getName())
                                        .status(p.getStatus())
                                        .progress(Math.round(progress * 10.0) / 10.0)
                                        .taskCount(total)
                                        .overdueCount(overdueMap.getOrDefault(p.getId(), 0L))
                                        .memberCount(memberMap.getOrDefault(p.getId(), 0L))
                                        .endDate(p.getEndDate())
                                        .build();
                }).collect(Collectors.toList());
        }

        @Override
        public PageResponse<DashboardTaskItem> getMyTasks(String filter, Pageable pageable) {
                Long userId = securityService.getCurrentUserId();
                OffsetDateTime now = OffsetDateTime.now();

                Page<TaskEntity> page = switch (filter == null ? "all" : filter.toLowerCase()) {
                        case "today" -> {
                                LocalDate today = LocalDate.now();
                                OffsetDateTime startOfDay = today.atStartOfDay().atOffset(ZoneOffset.UTC);
                                OffsetDateTime endOfDay = today.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);
                                yield taskRepository.findAssignedToUserDueToday(userId, startOfDay, endOfDay, pageable);
                        }
                        case "overdue" -> taskRepository.findAssignedToUserOverdue(userId, now, pageable);
                        default -> taskRepository.findAssignedToUser(userId, pageable);
                };

                List<DashboardTaskItem> items = page.getContent().stream()
                                .map(this::mapToTaskItem)
                                .collect(Collectors.toList());

                return PageResponse.<DashboardTaskItem>builder()
                                .data(items)
                                .page(page.getNumber())
                                .size(page.getSize())
                                .totalElements(page.getTotalElements())
                                .totalPages(page.getTotalPages())
                                .build();
        }

        private DashboardTaskItem mapToTaskItem(TaskEntity task) {
                return DashboardTaskItem.builder()
                                .id(task.getId())
                                .title(task.getTitle())
                                .projectName(task.getProject().getName())
                                .projectId(task.getProject().getId())
                                .workspaceId(task.getProject().getWorkspace().getId())
                                .status(task.getStatus())
                                .priority(task.getPriority())
                                .dueDate(task.getDueDate())
                                .build();
        }

        @Override
        public List<DeadlineItem> getUpcomingDeadlines(int days) {
                Long userId = securityService.getCurrentUserId();
                LocalDate today = LocalDate.now();
                LocalDate endDate = today.plusDays(days);
                OffsetDateTime startDateTime = today.atStartOfDay().atOffset(ZoneOffset.UTC);
                OffsetDateTime endDateTime = endDate.plusDays(1).atStartOfDay().atOffset(ZoneOffset.UTC);

                List<ProjectEntity> userProjects = projectMemberRepository.findProjectsByUserId(userId);
                List<Long> projectIds = userProjects.stream().map(ProjectEntity::getId).toList();

                List<DeadlineItem> deadlines = new ArrayList<>();

                // Tasks assigned to user due within the window
                if (!projectIds.isEmpty()) {
                        taskRepository.findUpcomingAssignedToUser(userId, startDateTime, endDateTime)
                                        .forEach(t -> deadlines.add(DeadlineItem.builder()
                                                        .id(t.getId())
                                                        .label(t.getTitle())
                                                        .type("TASK")
                                                        .date(t.getDueDate().toLocalDate())
                                                        .workspaceId(t.getProject().getWorkspace().getId())
                                                        .projectId(t.getProject().getId())
                                                        .build()));

                        // Sprints ending within the window (ACTIVE or PLANNING)
                        sprintRepository.findUpcomingByProjectIds(projectIds, today, endDate)
                                        .forEach(s -> deadlines.add(DeadlineItem.builder()
                                                        .id(s.getId())
                                                        .label(s.getName())
                                                        .type("SPRINT")
                                                        .date(s.getEndDate())
                                                        .workspaceId(s.getProject().getWorkspace().getId())
                                                        .projectId(s.getProject().getId())
                                                        .build()));
                }

                // Projects ending within the window (non-archived)
                userProjects.stream()
                                .filter(p -> p.getStatus() != ProjectStatus.ARCHIVED
                                                && p.getEndDate() != null
                                                && !p.getEndDate().isBefore(today)
                                                && !p.getEndDate().isAfter(endDate))
                                .forEach(p -> deadlines.add(DeadlineItem.builder()
                                                .id(p.getId())
                                                .label(p.getName())
                                                .type("PROJECT")
                                                .date(p.getEndDate())
                                                .workspaceId(p.getWorkspace().getId())
                                                .projectId(null)
                                                .build()));

                deadlines.sort(Comparator.comparing(DeadlineItem::getDate));
                return deadlines;
        }
}
