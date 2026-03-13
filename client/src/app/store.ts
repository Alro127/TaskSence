import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { authApi } from "@/features/auth/api/authApi";
import authReducer from "@/features/auth/authSlice";
import { userApi } from "@/features/user/api/userApi";
import { userSkillApi } from "@/features/user/api/userSkillApi";
import userReducer from "@/features/user/userSlice";
import { workspaceApi } from "@/features/workspace/api/workspaceApi";
import { workspaceMemberApi } from "@/features/workspace/api/workspaceMemberApi";
import { workspaceInviteApi } from "@/features/workspace/api/workspaceInviteApi";
import { workspaceJoinRequestApi } from "@/features/workspace/api/workspaceJoinRequestApi";
import workspaceReducer from "@/features/workspace/workspaceSlice";
import { teamTemplateApi } from "@/features/team-template/api/teamTemplateApi";
import { teamMemberTemplateApi } from "@/features/team-template/api/teamMemberTemplateApi";
import { projectApi } from "@/features/project/api/projectApi";
import { projectMemberApi } from "@/features/project/api/projectMemberApi";
import { projectJoinRequestApi } from "@/features/project/api/projectJoinRequestApi";
import { notificationApi } from "@/features/notification/api/notificationApi";
import notificationReducer from "@/features/notification/notificationSlice";
import { taskApi } from "@/features/task/api/taskApi";
import { commentApi } from "@/features/task/api/commentApi";
import { attachmentApi } from "@/features/task/api/attachmentApi";
import { sprintApi } from "@/features/sprint/api/sprintApi";

const combinedReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  workspace: workspaceReducer,
  [authApi.reducerPath]: authApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [userSkillApi.reducerPath]: userSkillApi.reducer,
  [workspaceApi.reducerPath]: workspaceApi.reducer,
  [workspaceMemberApi.reducerPath]: workspaceMemberApi.reducer,
  [workspaceInviteApi.reducerPath]: workspaceInviteApi.reducer,
  [workspaceJoinRequestApi.reducerPath]: workspaceJoinRequestApi.reducer,
  [teamTemplateApi.reducerPath]: teamTemplateApi.reducer,
  [teamMemberTemplateApi.reducerPath]: teamMemberTemplateApi.reducer,
  [projectApi.reducerPath]: projectApi.reducer,
  [projectMemberApi.reducerPath]: projectMemberApi.reducer,
  [projectJoinRequestApi.reducerPath]: projectJoinRequestApi.reducer,
  notification: notificationReducer,
  [notificationApi.reducerPath]: notificationApi.reducer,
  [taskApi.reducerPath]: taskApi.reducer,
  [commentApi.reducerPath]: commentApi.reducer,
  [attachmentApi.reducerPath]: attachmentApi.reducer,
  [sprintApi.reducerPath]: sprintApi.reducer,
});

type RootReducerState = ReturnType<typeof combinedReducer>;

// When `auth/logout` is dispatched, reset ALL state except `auth`
// (auth already clears itself via its own logout reducer).
// This wipes every RTK Query cache and all feature slice data.
const rootReducer = (
  state: RootReducerState | undefined,
  action: { type: string }
): RootReducerState => {
  if (action.type === "auth/logout" && state) {
    return combinedReducer({ auth: state.auth } as RootReducerState, action);
  }
  return combinedReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(authApi.middleware)
      .concat(userApi.middleware)
      .concat(userSkillApi.middleware)
      .concat(workspaceApi.middleware)
      .concat(workspaceMemberApi.middleware)
      .concat(workspaceInviteApi.middleware)
      .concat(workspaceJoinRequestApi.middleware)
      .concat(teamTemplateApi.middleware)
      .concat(teamMemberTemplateApi.middleware)
      .concat(projectApi.middleware)
      .concat(projectMemberApi.middleware)
      .concat(projectJoinRequestApi.middleware)
      .concat(notificationApi.middleware)
      .concat(taskApi.middleware)
      .concat(commentApi.middleware)
      .concat(attachmentApi.middleware)
      .concat(sprintApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

