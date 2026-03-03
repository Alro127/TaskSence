import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom";

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
import { EditProfilePage } from "@/features/user/pages";
import { WorkspacesPage, WorkspaceDetailPage } from "@/features/workspace/pages";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This section is mocked for quick access and will be implemented in a future sprint.
      </p>
    </div>
  );
}

const routes: RouteObject[] = [
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
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "dashboard/edit-profile",
        element: <EditProfilePage />,
      },
      {
        path: "workspaces",
        element: <WorkspacesPage />,
      },
      {
        path: "workspaces/:id",
        element: <WorkspaceDetailPage />,
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
    ],
  },
  {
    path: "*",
    element: <Navigate to="/auth/login" replace />,
  },
];

export const router = createBrowserRouter(routes);
