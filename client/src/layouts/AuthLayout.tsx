import { Outlet, Navigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { CheckCircle, BarChart3, Users, Zap } from "lucide-react";

const features = [
  {
    icon: CheckCircle,
    title: "Smart Task Management",
    description: "Organize and track tasks with intelligent prioritization",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Get insights into your productivity and team performance",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together seamlessly with real-time updates",
  },
  {
    icon: Zap,
    title: "Automation",
    description: "Automate repetitive workflows and save time",
  },
];

export function AuthLayout() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <Zap className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">TaskSense</h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            Intelligent Task & Performance Management
          </p>
        </div>

        <div className="space-y-6">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <feature.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-primary-foreground/70">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-primary-foreground/50">
          &copy; {new Date().getFullYear()} TaskSense. All rights reserved.
        </p>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">TaskSense</h1>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
