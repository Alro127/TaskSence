import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom";

import { AuthLayout } from "@/layouts/AuthLayout";
import {
  LoginPage,
  RegisterPage,
  VerifyOtpPage,
  ForgotPasswordPage,
} from "@/features/auth/pages";

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
    ],
  },
  {
    path: "/dashboard",
    element: (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Welcome to TaskSense!</h1>
          <p className="text-muted-foreground">
            Dashboard will be built in the next sprint.
          </p>
        </div>
      </div>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/auth/login" replace />,
  },
];

export const router = createBrowserRouter(routes);
