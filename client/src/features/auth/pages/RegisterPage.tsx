import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
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
  useLoginWithGoogleMutation,
  useRegisterMutation,
} from "@/features/auth/api/authApi";
import { useAppDispatch } from "@/app/hooks";
import { setCredentials, setPendingEmail } from "@/features/auth/authSlice";
import { useLazyGetCurrentUserQuery } from "@/features/user/api/userApi";
import { setCurrentUser } from "@/features/user/userSlice";

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [registerUser, { isLoading }] = useRegisterMutation();
  const [loginWithGoogle] = useLoginWithGoogleMutation();
  const [fetchCurrentUser] = useLazyGetCurrentUserQuery();
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        email: data.email,
        password: data.password,
      }).unwrap();

      dispatch(setPendingEmail(data.email));

      toast.success("Registration successful!", {
        description: "Please check your email for the OTP verification code.",
      });

      navigate("/auth/verify-otp");
    } catch (error: unknown) {
      const err = error as { data?: { message?: string }; status?: number };
      toast.error("Registration failed", {
        description:
          err?.data?.message ||
          "Something went wrong. Please try again.",
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
        const userResult = await fetchCurrentUser().unwrap();
        dispatch(setCurrentUser(userResult.data));
        toast.success("Welcome!", {
          description: "Your Google account is ready to use TaskSense.",
        });
        navigate("/dashboard");
      } catch (error: unknown) {
        const err = error as { data?: { message?: string } };
        toast.error("Google sign up failed", {
          description:
            err?.data?.message ||
            "Unable to complete Google sign up. Please try again.",
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
      toast.error("Google sign up cancelled", {
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
        <h2 className="text-2xl font-bold tracking-tight">Create an account</h2>
        <p className="text-sm text-muted-foreground">
          Enter your details to get started with TaskSense
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
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            placeholder="Create a strong password"
            autoComplete="new-password"
            disabled={isSubmitting}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <PasswordInput
            id="confirmPassword"
            placeholder="Confirm your password"
            autoComplete="new-password"
            disabled={isSubmitting}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
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
          "Sign up with Google"
        )}
      </GoogleButton>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          to="/auth/login"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
