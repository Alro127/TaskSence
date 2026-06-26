import { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import {
  FolderKanban,
  Globe,
  LayoutDashboard,
  LogOut,
  User,
  X,
  BookOpen,
  GitBranch,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Bot,
  Users,
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
import { GuidanceOverlay } from "@/features/guidance/components/GuidanceOverlay";
import { GuidanceNavigator } from "@/features/guidance/components/GuidanceNavigator";

const topNavItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "My Workspace", to: "/workspaces", icon: FolderKanban },
  { label: "Workflows", to: "/workflows", icon: GitBranch },
  { label: "Community", to: "/community", icon: Globe },
  { label: "AI Assistant", to: "/agent", icon: Bot },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Team Templates", to: "/team-templates", icon: Users },
];

const bottomNavItems: Array<{ label: string; to: string; icon: any }> = [
  // { label: "Settings", to: "/settings", icon: Settings },
];

// ---------------------------------------------------------------------------
// Sidebar content — reused for both desktop and mobile overlay
// ---------------------------------------------------------------------------
interface SidebarContentProps {
  collapsed: boolean;
  onNavClick?: () => void;
  onLogout: () => void;
  isLogoutLoading: boolean;
  onToggleCollapse?: () => void;
}

function SidebarContent({
  collapsed,
  onNavClick,
  onLogout,
  isLogoutLoading,
  onToggleCollapse,
}: SidebarContentProps) {
  return (
    <>
      {/* Brand */}
      <div
        className={[
          "shrink-0 pb-6",
          collapsed ? "flex justify-center px-3" : "px-5",
        ].join(" ")}
      >
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#233a87]">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Top nav */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <nav className="flex-1 min-h-0 overflow-y-auto space-y-0.5 px-2">
          {topNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.to}
                end
                onClick={onNavClick}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  [
                    "flex items-center py-2.5 text-sm transition-colors",
                    collapsed ? "justify-center px-2" : "gap-3",
                    isActive
                      ? collapsed
                        ? "bg-[#e9e8e6] text-[#233a87] rounded-md"
                        : "border-l-4 border-[#233a87] bg-[#e9e8e6] pl-2 pr-3 text-[#233a87] font-semibold rounded-r-md"
                      : "px-3 rounded-md text-[#444651] hover:bg-[#e9e8e6] hover:text-[#1a1c1b]",
                  ].join(" ")
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom nav — account */}
      <div className="shrink-0 px-2 space-y-0.5">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              end
              onClick={onNavClick}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                [
                  "flex items-center py-2.5 text-sm transition-colors",
                  collapsed ? "justify-center px-2" : "gap-3",
                  isActive
                    ? collapsed
                      ? "bg-[#e9e8e6] text-[#233a87] rounded-md"
                      : "border-l-4 border-[#233a87] bg-[#e9e8e6] pl-2 pr-3 text-[#233a87] font-semibold rounded-r-md"
                    : "px-3 rounded-md text-[#444651] hover:bg-[#e9e8e6] hover:text-[#1a1c1b]",
                ].join(" ")
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
        <button
          onClick={onLogout}
          disabled={isLogoutLoading}
          title={collapsed ? "Logout" : undefined}
          className={[
            "flex w-full items-center py-2.5 text-sm rounded-md transition-colors text-[#444651] hover:bg-[#e9e8e6] hover:text-[#c0392b]",
            collapsed ? "justify-center px-2" : "gap-3 px-3",
          ].join(" ")}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <span>{isLogoutLoading ? "Logging out…" : "Logout"}</span>
          )}
        </button>
      </div>

      {/* Collapse toggle — desktop only */}
      {onToggleCollapse && (
        <div
          className={[
            "shrink-0 pt-4 flex items-center",
            collapsed ? "justify-center px-3" : "justify-between px-5",
          ].join(" ")}
        >
          {!collapsed && (
            <p className="text-[11px] text-[#444651]">
              &copy; {new Date().getFullYear()} TaskSense
            </p>
          )}
          <button
            onClick={onToggleCollapse}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#444651] transition-colors hover:bg-[#e9e8e6] hover:text-[#1a1c1b]"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// MainLayout
// ---------------------------------------------------------------------------
export function MainLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const currentUser = useAppSelector((state) => state.user.currentUser);

  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
      setIsMobileSidebarOpen(false);
      toast.success("Logged out successfully");
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#faf9f7]">
      <div className="flex h-full">

        {/* ── Desktop Sidebar ── */}
        <aside
          className={[
            "hidden md:flex flex-col h-full bg-[#f4f3f1] py-6 transition-all duration-200 shrink-0",
            isSidebarCollapsed ? "w-16" : "w-64",
          ].join(" ")}
        >
          <SidebarContent
            collapsed={isSidebarCollapsed}
            onLogout={handleLogout}
            isLogoutLoading={isLogoutLoading}
            onToggleCollapse={() => setIsSidebarCollapsed((v) => !v)}
          />
        </aside>

        {/* ── Mobile Sidebar Overlay ── */}
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <button
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
              aria-label="Close sidebar"
            />

            {/* Drawer */}
            <aside className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col bg-[#f4f3f1] py-6 shadow-[0_1px_32px_rgba(0,0,0,0.12)] md:hidden">
              {/* Close button */}
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-[#444651] hover:bg-[#e9e8e6]"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4" />
              </button>

              <SidebarContent
                collapsed={false}
                onNavClick={() => setIsMobileSidebarOpen(false)}
                onLogout={handleLogout}
                isLogoutLoading={isLogoutLoading}
              />
            </aside>
          </>
        )}

        {/* ── Main area ── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

          {/* Top app bar */}
          <header className="flex h-14 shrink-0 items-center justify-between bg-[#faf9f7] px-4 md:px-8">
            <div className="flex items-center gap-3">
              {/* Hamburger — mobile only */}
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-[#444651] transition-colors hover:bg-[#f4f3f1] md:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              <p className="hidden text-xs font-medium uppercase tracking-widest text-[#444651] md:block">
                Workspace
              </p>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <NotificationDropdown />
              <button
                onClick={() => setIsProfileDrawerOpen(true)}
                className="flex items-center gap-2 rounded-md bg-[#f4f3f1] px-2.5 py-1.5 text-sm font-medium text-[#1a1c1b] transition-colors hover:bg-[#e9e8e6] md:gap-2.5 md:px-3 md:py-2"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#233a87] text-[10px] font-bold text-white">
                  {currentUser?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <span className="hidden max-w-[120px] truncate sm:block">
                  {currentUser?.fullName || "Profile"}
                </span>
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      <GuidanceOverlay />
      <GuidanceNavigator />

      {/* ── Profile Drawer ── */}
      {isProfileDrawerOpen && (
        <>
          <button
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsProfileDrawerOpen(false)}
            aria-label="Close profile drawer"
          />

          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-[#faf9f7] shadow-[0_1px_32px_rgba(0,0,0,0.10)] p-6 md:max-w-md">
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
                    navigate("/profile");
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
