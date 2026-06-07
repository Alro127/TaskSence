package dev.alro127.tasksense.service;

import dev.alro127.tasksense.domain.entity.*;
import dev.alro127.tasksense.dto.response.ProjectAnalyticsResponse;

import java.util.List;

public interface SearchIndexService {

    void indexTask(TaskEntity task);

    void indexTasks(List<TaskEntity> tasks);

    void removeTask(Long taskId);

    void removeTasksByProject(Long projectId);

    void indexProject(ProjectEntity project);

    void indexProjects(List<ProjectEntity> projects);

    void removeProject(Long projectId);

    void removeProjectsByWorkspace(Long workspaceId);

    void indexComment(CommentEntity comment);

    void indexComments(List<CommentEntity> comments);

    void removeComment(Long commentId);

    void removeCommentsByTask(Long taskId);

    void removeCommentsByProject(Long projectId);

    void indexUser(UserEntity user);

    void indexUsers(List<UserEntity> users);

    void removeUser(Long userId);

    ProjectAnalyticsResponse getProjectAnalytics(Long projectId);
}
