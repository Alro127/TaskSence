package dev.alro127.tasksense.domain.enums;

import lombok.Getter;

@Getter
public enum GuidanceCapability {
    // Project & Workspace
    NAVIGATE_PROJECT_DETAIL("Project Detail Page", "The main overview page of a project"),
    NAVIGATE_WORKSPACE_DASHBOARD("Workspace Dashboard", "The main dashboard of a workspace"),

    // Task Management
    CREATE_TASK("Create Task Button", "Button or form trigger to add a new task"),
    UPDATE_TASK_STATUS("Task Status Selector", "Dropdown or drag-handle to change task status"),
    NAVIGATE_TASK_BOARD("Task Board Tab", "The Kanban board view of tasks"),

    // Sprint Management
    CREATE_SPRINT("Create Sprint Button", "Button to initialize a new sprint"),
    NAVIGATE_SPRINT_LIST("Sprint List", "The management tab for sprints"),

    // Team & Collaboration
    INVITE_MEMBER("Invite Member Button", "Button to add new users to the project"),

    // Guidance Card
    PROJECT_GUIDANCE("Project Guidance Card", "The AI Guidance card where summary and tips are shown"),

    // Fallback
    MANUAL("Manual Action", "A step that requires manual user confirmation");

    private final String label;
    private final String description;

    GuidanceCapability(String label, String description) {
        this.label = label;
        this.description = description;
    }
}
