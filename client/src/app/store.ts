import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "@/features/auth/api/authApi";
import authReducer from "@/features/auth/authSlice";
import { userApi } from "@/features/user/api/userApi";
import { userSkillApi } from "@/features/user/api/userSkillApi";
import userReducer from "@/features/user/userSlice";
import { workspaceApi } from "@/features/workspace/api/workspaceApi";
import { workspaceMemberApi } from "@/features/workspace/api/workspaceMemberApi";
import { workspaceInviteApi } from "@/features/workspace/api/workspaceInviteApi";
import workspaceReducer from "@/features/workspace/workspaceSlice";
import { teamTemplateApi } from "@/features/team-template/api/teamTemplateApi";
import { teamMemberTemplateApi } from "@/features/team-template/api/teamMemberTemplateApi";
import { projectApi } from "@/features/project/api/projectApi";
import { projectMemberApi } from "@/features/project/api/projectMemberApi";
import { projectJoinRequestApi } from "@/features/project/api/projectJoinRequestApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    workspace: workspaceReducer,
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [userSkillApi.reducerPath]: userSkillApi.reducer,
    [workspaceApi.reducerPath]: workspaceApi.reducer,
    [workspaceMemberApi.reducerPath]: workspaceMemberApi.reducer,
    [workspaceInviteApi.reducerPath]: workspaceInviteApi.reducer,
    [teamTemplateApi.reducerPath]: teamTemplateApi.reducer,
    [teamMemberTemplateApi.reducerPath]: teamMemberTemplateApi.reducer,
    [projectApi.reducerPath]: projectApi.reducer,
    [projectMemberApi.reducerPath]: projectMemberApi.reducer,
    [projectJoinRequestApi.reducerPath]: projectJoinRequestApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(userApi.middleware)
      .concat(userSkillApi.middleware)
      .concat(workspaceApi.middleware)
      .concat(workspaceMemberApi.middleware)
      .concat(workspaceInviteApi.middleware)
      .concat(teamTemplateApi.middleware)
      .concat(teamMemberTemplateApi.middleware)
      .concat(projectApi.middleware)
      .concat(projectMemberApi.middleware)
      .concat(projectJoinRequestApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

