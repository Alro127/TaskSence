import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PasswordInput, GoogleButton } from "@/components/common";
import {
  useLoginMutation,
  useLoginWithGoogleMutation,
} from "@/features/auth/api/authApi";
import { useAppDispatch } from "@/app/hooks";
import { setCredentials } from "@/features/auth/authSlice";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [loginWithGoogle] = useLoginWithGoogleMutation();
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login(data).unwrap();
      dispatch(
        setCredentials({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        })
      );
      toast.success("Welcome back!", {
        description: "You have successfully logged in.",
      });
      navigate("/dashboard");
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; status?: number };
      toast.error("Login failed", {
        description: err?.data?.message || "Invalid email or password. Please try again.",
      });
    }
  };

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        if (googleTimeoutRef.current) {
          clearTimeout(googleTimeoutRef.current);
          googleTimeoutRef.current = null;
        }
        const result = await loginWithGoogle({ code: codeResponse.code }).unwrap();
        dispatch(
          setCredentials({
            accessToken: result.data.accessToken,
            refreshToken: result.data.refreshToken,
          })
        );
        toast.success("Welcome!", {
          description: "You have successfully logged in with Google.",
        });
        navigate("/dashboard");
      } catch (error: unknown) {
        const err = error as { data?: { message?: string } };
        toast.error("Google login failed", {
          description:
            err?.data?.message ||
            "Unable to complete Google login. Please try again.",
        });
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      if (googleTimeoutRef.current) {
        clearTimeout(googleTimeoutRef.current);
        googleTimeoutRef.current = null;
      }
      setGoogleLoading(false);
      toast.error("Google login cancelled", {
        description: "Please try again to continue with Google.",
      });
    },
  });

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === "your-google-client-id-here") {
      toast.error("Google Client ID is missing", {
        description: "Please set VITE_GOOGLE_CLIENT_ID in your .env file.",
      });
      return;
    }

    setGoogleLoading(true);
    googleLogin();
  };

  // Handle Google OAuth dialog closure detection
  useEffect(() => {
    if (!googleLoading) return;

    const handleWindowFocus = () => {
      // When window regains focus after Google dialog closes,
      // wait a bit to see if onSuccess/onError gets called
      googleTimeoutRef.current = setTimeout(() => {
        setGoogleLoading((prevState) => {
          // Only reset if still loading (callback wasn't called)
          if (prevState) {
            return false;
          }
          return prevState;
        });
        googleTimeoutRef.current = null;
      }, 500);
    };

    window.addEventListener("focus", handleWindowFocus);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      if (googleTimeoutRef.current) {
        clearTimeout(googleTimeoutRef.current);
        googleTimeoutRef.current = null;
      }
    };
  }, [googleLoading]);

  const isSubmitting = isLoading || googleLoading;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="name@example.com"
            autoComplete="email"
            disabled={isSubmitting}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={isSubmitting}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <GoogleButton onClick={handleGoogleLogin} disabled={isSubmitting}>
        {googleLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          "Continue with Google"
        )}
      </GoogleButton>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          to="/auth/register"
          className="font-medium text-primary hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
