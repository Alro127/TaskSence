import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom";
import { LogOut } from "lucide-react";

import { AuthLayout } from "@/layouts/AuthLayout";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  LoginPage,
  RegisterPage,
  VerifyOtpPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "@/features/auth/pages";
import { useLogoutMutation } from "@/features/auth/api/authApi";
import { logout } from "@/features/auth/authSlice";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function DashboardPage() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const [logoutApi, { isLoading }] = useLogoutMutation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await logoutApi({ token: refreshToken }).unwrap();
      }
    } catch {
      toast.error("Logout sync failed", {
        description: "Session was cleared on this device.",
      });
    } finally {
      dispatch(logout());
      toast.success("Logged out successfully");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-xl border bg-card p-8 text-center space-y-5">
        <h1 className="text-3xl font-bold">Welcome to TaskSense!</h1>
        <p className="text-muted-foreground">
          Dashboard will be expanded in the next sprint.
        </p>
        <Button onClick={handleLogout} disabled={isLoading} className="w-full sm:w-auto">
          <LogOut className="mr-2 h-4 w-4" />
          {isLoading ? "Logging out..." : "Logout"}
        </Button>
      </div>
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
    path: "/dashboard",
    element: <DashboardPage />,
  },
  {
    path: "*",
    element: <Navigate to="/auth/login" replace />,
  },
];

export const router = createBrowserRouter(routes);
