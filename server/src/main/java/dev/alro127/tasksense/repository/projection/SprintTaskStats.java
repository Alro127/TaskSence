package dev.alro127.tasksense.repository.projection;

public interface SprintTaskStats {

    Long getSprintId();

    Long getTaskCount();

    Long getCompletedTaskCount();

}