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
  BookOpen,
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

  useNotificationSocket();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

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

        {/* ── Sidebar ── */}
        <aside className="w-64 flex flex-col bg-[#f4f3f1] py-6">
          {/* Brand */}
          <div className="px-5 pb-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#233a87]">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <h1
                className="text-lg font-bold tracking-tight text-[#1a1c1b]"
                style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
              >
                TaskSense
              </h1>
            </div>
            <p className="mt-1 pl-[2.625rem] text-[11px] font-medium uppercase tracking-widest text-[#444651]">
              Academic Workspace
            </p>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-0.5 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === "/workspaces"}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 py-2.5 text-sm transition-colors",
                      item.indent ? "ml-5" : "",
                      isActive
                        ? "border-l-4 border-[#233a87] bg-[#e9e8e6] pl-2 pr-3 text-[#233a87] font-semibold rounded-r-md"
                        : "px-3 rounded-md text-[#444651] hover:bg-[#e9e8e6] hover:text-[#1a1c1b]",
                    ].join(" ")
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer user hint */}
          <div className="px-5 pt-4">
            <p className="text-[11px] text-[#444651]">
              &copy; {new Date().getFullYear()} TaskSense
            </p>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Top app bar — no border, transparent */}
          <header className="flex h-16 items-center justify-between bg-background px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#444651]">
                Workspace
              </p>
            </div>

            <div className="flex items-center gap-3">
              <NotificationDropdown />
              <button
                onClick={() => setIsProfileDrawerOpen(true)}
                className="flex items-center gap-2.5 rounded-md bg-[#f4f3f1] px-3 py-2 text-sm font-medium text-[#1a1c1b] transition-colors hover:bg-[#e9e8e6]"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#233a87] text-[10px] font-bold text-white">
                  {currentUser?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <span className="max-w-[120px] truncate">
                  {currentUser?.fullName || "Profile"}
                </span>
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* ── Profile Drawer ── */}
      {isProfileDrawerOpen && (
        <>
          <button
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsProfileDrawerOpen(false)}
            aria-label="Close profile drawer"
          />

          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background shadow-[0_1px_32px_rgba(0,0,0,0.10)] p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3
                className="text-lg font-bold text-[#1a1c1b]"
                style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
              >
                Your Profile
              </h3>
              <button
                onClick={() => setIsProfileDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#444651] transition-colors hover:bg-[#f4f3f1]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              <UserProfileCard user={currentUser} isLoading={!currentUser} />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsProfileDrawerOpen(false);
                    navigate("/dashboard/edit-profile");
                  }}
                  className="flex-1 rounded-md border border-[rgba(197,197,211,0.4)] bg-transparent px-4 py-2.5 text-sm font-medium text-[#233a87] transition-colors hover:bg-[#f4f3f1]"
                >
                  Edit profile
                </button>
                <Button
                  onClick={handleLogout}
                  disabled={isLogoutLoading}
                  className="flex-1 bg-[#233a87] text-white hover:opacity-90"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLogoutLoading ? "Logging out…" : "Logout"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
