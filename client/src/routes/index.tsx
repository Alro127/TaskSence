import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom";

import { NotFoundPage } from "@/pages/NotFoundPage";
import { LandingPage } from "@/pages/LandingPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";

import { AuthLayout } from "@/layouts/AuthLayout";
import { MainLayout } from "@/layouts/MainLayout";
import {
  LoginPage,
  RegisterPage,
  VerifyOtpPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "@/features/auth/pages";
import { DashboardPage } from "@/features/dashboard/pages";
import { CommunityPage } from "@/features/community/pages";
import { ProfilePage } from "@/features/user/pages";
import { WorkspacesPage, WorkspaceDetailPage, WorkspaceInvitationPage, WorkspaceExplorePage } from "@/features/workspace/pages";
import { TeamTemplatesPage, TeamTemplateDetailPage } from "@/features/team-template/pages";
import { CreateProjectPage, ProjectDetailPage } from "@/features/project/pages";
import { TaskBoardPage, TaskDetailPage } from "@/features/task/pages";
import {
  ExplorePage,
  MyWorkflowsPage,
  PublicWorkflowDetailPage,
  WorkflowEditorPage,
} from "@/features/workflow/pages";
import { AgentChatPage } from "@/features/agent/pages";

const routes: RouteObject[] = [
  // Public landing page — standalone (no app shell)
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
      {
        path: "verify-otp",
        element: <VerifyOtpPage />,
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
      {
        path: "reset-password",
        element: <ResetPasswordPage />,
      },
    ],
  },
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "dashboard/edit-profile",
        element: <Navigate to="/profile" replace />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
      {
        path: "community",
        element: <CommunityPage />,
      },
      {
        path: "workspaces",
        element: <WorkspacesPage />,
      },
      {
        path: "workspaces/explore",
        element: <WorkspaceExplorePage />,
      },
      {
        path: "explore",
        element: <ExplorePage />,
      },
      {
        path: "explore/:workflowId",
        element: <PublicWorkflowDetailPage />,
      },
      {
        path: "workspaces/invitation",
        element: <WorkspaceInvitationPage />,
      },
      {
        path: "workspaces/:id",
        element: <WorkspaceDetailPage />,
      },
      {
        path: "workspaces/:id/projects/new",
        element: <CreateProjectPage />,
      },
      {
        path: "workspaces/:id/projects/:projectId",
        element: <ProjectDetailPage />,
      },
      {
        path: "workspaces/:id/projects/:projectId/tasks",
        element: <TaskBoardPage />,
      },
      {
        path: "workspaces/:id/projects/:projectId/tasks/:taskId",
        element: <TaskDetailPage />,
      },
      {
        path: "workflows",
        element: <MyWorkflowsPage />,
      },
      {
        path: "workflows/:workflowId",
        element: <WorkflowEditorPage />,
      },
      {
        path: "team-templates",
        element: <TeamTemplatesPage />,
      },
      {
        path: "team-templates/:id",
        element: <TeamTemplateDetailPage />,
      },
      {
        path: "tasks",
        element: <PlaceholderPage title="My Tasks" />,
      },
      {
        path: "calendar",
        element: <PlaceholderPage title="Calendar" />,
      },
      {
        path: "analytics",
        element: <PlaceholderPage title="Analytics" />,
      },
      {
        path: "settings",
        element: <PlaceholderPage title="Settings" />,
      },
      {
        path: "agent",
        element: <AgentChatPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
];

export const router = createBrowserRouter(routes);
