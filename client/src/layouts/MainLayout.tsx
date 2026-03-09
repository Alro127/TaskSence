import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  Compass,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Users,
  X,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/authSlice";
import { useLogoutMutation } from "@/features/auth/api/authApi";
import { UserProfileCard } from "@/features/user/components";
import { useGetCurrentUserQuery } from "@/features/user/api/userApi";
import { clearCurrentUser, setCurrentUser } from "@/features/user/userSlice";
import { clearWorkspace } from "@/features/workspace/workspaceSlice";
import { NotificationDropdown } from "@/features/notification/components/NotificationDropdown";
import { useNotificationSocket } from "@/features/notification/hooks/useNotificationSocket";
import { clearNotifications } from "@/features/notification/notificationSlice";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Workspaces", to: "/workspaces", icon: FolderKanban },
  { label: "Explore", to: "/workspaces/explore", icon: Compass, indent: true },
  { label: "Team Templates", to: "/team-templates", icon: Users },
  { label: "My Tasks", to: "/tasks", icon: CheckSquare },
  { label: "Calendar", to: "/calendar", icon: Calendar },
  { label: "Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings", icon: Settings },
];

export function MainLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [logoutApi, { isLoading: isLogoutLoading }] = useLogoutMutation();
  const { data: userData } = useGetCurrentUserQuery();

  // Start persistent WebSocket connection for notifications
  useNotificationSocket();

  // Fetch current user on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Hydrate Redux store with fetched user data (use setCurrentUser so it works
  // even on page reload when currentUser is still null in initial state)
  useEffect(() => {
    if (userData?.data) {
      dispatch(setCurrentUser(userData.data));
    }
  }, [userData?.data, dispatch]);

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
      dispatch(clearCurrentUser());
      dispatch(clearWorkspace());
      dispatch(clearNotifications());
      setIsProfileDrawerOpen(false);
      toast.success("Logged out successfully");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="w-64 border-r bg-card px-3 py-4">
          <div className="px-2 pb-4">
            <h1 className="text-lg font-semibold">TaskSense</h1>
            <p className="text-xs text-muted-foreground">Quick Access</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === "/workspaces"}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      item.indent ? "ml-3" : "",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    ].join(" ")
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 items-center justify-between border-b bg-background px-6">
            <div>
              <h2 className="text-sm font-medium text-muted-foreground">
                Workspace
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setIsProfileDrawerOpen(true)}
              >
                <User className="h-4 w-4" />
                <span>{currentUser?.fullName || "Profile"}</span>
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>

      {isProfileDrawerOpen && (
        <>
          <button
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setIsProfileDrawerOpen(false)}
            aria-label="Close profile drawer"
          />

          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l bg-background p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Profile</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsProfileDrawerOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <UserProfileCard user={currentUser} isLoading={!currentUser} />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsProfileDrawerOpen(false);
                    navigate("/dashboard/edit-profile");
                  }}
                >
                  Edit profile
                </Button>
                <Button onClick={handleLogout} disabled={isLogoutLoading}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLogoutLoading ? "Logging out..." : "Logout"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}