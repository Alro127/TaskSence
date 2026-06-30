package dev.alro127.tasksense.security.permission;

import org.junit.jupiter.api.Test;

import dev.alro127.tasksense.domain.enums.WorkspaceRole;

import static org.assertj.core.api.Assertions.assertThat;

class PermissionPolicyTest {

    private final PermissionPolicy permissionPolicy = new PermissionPolicy();

    @Test
    void workspaceManagerCannotCreateProject() {
        assertThat(permissionPolicy.hasWorkspacePermission(
                WorkspaceRole.MANAGER,
                WorkspacePermission.CREATE_PROJECT)).isFalse();
    }

    @Test
    void workspaceMemberAndViewerCannotCreateProject() {
        assertThat(permissionPolicy.hasWorkspacePermission(
                WorkspaceRole.MEMBER,
                WorkspacePermission.CREATE_PROJECT)).isFalse();
        assertThat(permissionPolicy.hasWorkspacePermission(
                WorkspaceRole.VIEWER,
                WorkspacePermission.CREATE_PROJECT)).isFalse();
    }
}
