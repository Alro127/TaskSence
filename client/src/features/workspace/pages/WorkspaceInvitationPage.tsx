import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Loader2, FolderKanban, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppSelector } from "@/app/hooks";
import { useAcceptInviteMutation } from "../api/workspaceInviteApi";

type PageState = "idle" | "loading" | "success" | "error" | "no-token";

export function WorkspaceInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [acceptInvite] = useAcceptInviteMutation();

  const [pageState, setPageState] = useState<PageState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [acceptedWorkspaceId, setAcceptedWorkspaceId] = useState<number | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      const redirectTo = `/workspaces/invitation?token=${token ?? ""}`;
      navigate(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`, {
        replace: true,
      });
    }
  }, [isAuthenticated, navigate, token]);

  // No token in URL
  if (!token) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <XCircle className="h-12 w-12 text-destructive" />
        <div>
          <h2 className="text-xl font-semibold">Invalid Invitation Link</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This invitation link is missing a token. Please check your email and
            try again.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const handleAccept = async () => {
    setPageState("loading");
    try {
      const result = await acceptInvite(token).unwrap();
      setAcceptedWorkspaceId(result.data.workspaceId);
      setPageState("success");
      toast.success("You've successfully joined the workspace!");
    } catch (err) {
      const msg = getApiErrorMessage(err, "The invitation may have expired or been revoked.");
      setErrorMessage(msg);
      setPageState("error");
    }
  };

  const handleDecline = () => {
    toast.info("Invitation declined");
    navigate("/dashboard");
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (pageState === "success") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold">You've joined the workspace!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You can now collaborate with your team members.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              onClick={() =>
                navigate(
                  acceptedWorkspaceId
                    ? `/workspaces/${acceptedWorkspaceId}`
                    : "/workspaces"
                )
              }
            >
              Go to Workspace
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (pageState === "error") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <h2 className="text-xl font-semibold">Invitation Failed</h2>
          <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
          <div className="mt-6">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ── Default / idle state ──────────────────────────────────────────────────
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <Card className="w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 px-8 py-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
              <FolderKanban className="h-7 w-7 text-primary" />
            </div>
          </div>
          <h1 className="text-xl font-semibold">Workspace Invitation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You've been invited to join a workspace on TaskSense.
          </p>
        </div>

        <Separator />

        {/* Body */}
        <div className="px-8 py-6 space-y-6">
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground text-center">
            Click <strong className="text-foreground">Accept Invitation</strong> to
            join the workspace and start collaborating with your team.
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1"
              onClick={handleAccept}
              disabled={pageState === "loading"}
            >
              {pageState === "loading" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Accept Invitation
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDecline}
              disabled={pageState === "loading"}
            >
              Decline
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By accepting, you agree to join this workspace and its associated
            projects. You can leave at any time.{" "}
            <Link to="/dashboard" className="underline hover:text-foreground">
              Back to Dashboard
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
