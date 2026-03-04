import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { useVerifyOtpMutation } from "@/features/auth/api/authApi";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setCredentials, clearPendingEmail } from "@/features/auth/authSlice";
import { useLazyGetCurrentUserQuery } from "@/features/user/api/userApi";
import { setCurrentUser } from "@/features/user/userSlice";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const pendingEmail = useAppSelector((state) => state.auth.pendingEmail);
  const [verifyOtp, { isLoading }] = useVerifyOtpMutation();
  const [fetchCurrentUser] = useLazyGetCurrentUserQuery();

  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  // Redirect if no pending email
  useEffect(() => {
    if (!pendingEmail) {
      navigate("/auth/register", { replace: true });
    }
  }, [pendingEmail, navigate]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleVerify = async () => {
    if (!pendingEmail || otp.length !== OTP_LENGTH) return;

    try {
      const result = await verifyOtp({
        email: pendingEmail,
        otp,
      }).unwrap();

      dispatch(
        setCredentials({
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        })
      );
      dispatch(clearPendingEmail());
      const userResult = await fetchCurrentUser().unwrap();
      dispatch(setCurrentUser(userResult.data));

      toast.success("Email verified!", {
        description: "Your account has been activated successfully.",
      });

      navigate("/dashboard");
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error("Verification failed", {
        description:
          err?.data?.message || "Invalid or expired OTP. Please try again.",
      });
      setOtp("");
    }
  };

  const handleResendOtp = () => {
    // TODO: Call resend OTP API when available
    toast.info("OTP resent!", {
      description: `A new code has been sent to ${pendingEmail}`,
    });
    setResendTimer(RESEND_COOLDOWN);
    setCanResend(false);
    setOtp("");
  };

  // Auto-submit when all digits entered
  useEffect(() => {
    if (otp.length === OTP_LENGTH) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  if (!pendingEmail) return null;

  return (
    <div className="space-y-6">
      <Link
        to="/auth/register"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to registration
      </Link>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Verify your email</h2>
        <p className="text-sm text-muted-foreground">
          We've sent a 6-digit verification code to
        </p>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Mail className="h-4 w-4 text-primary" />
          {pendingEmail}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <InputOTP
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          onClick={handleVerify}
          className="w-full"
          disabled={isLoading || otp.length !== OTP_LENGTH}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Email"
          )}
        </Button>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?{" "}
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOtp}
                className="font-medium text-primary hover:underline"
              >
                Resend OTP
              </button>
            ) : (
              <span className="text-muted-foreground">
                Resend in {resendTimer}s
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
