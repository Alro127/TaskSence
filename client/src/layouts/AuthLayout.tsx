import { Outlet, Navigate } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { BookOpen, Brain, BarChart3, Users, Zap } from "lucide-react";

const features = [
  {
    icon: Brain,
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
    <div className="flex min-h-screen bg-[#faf9f7]">

      {/* ── Left panel: Deep Indigo brand ── */}
      <div className="hidden lg:flex lg:w-[46%] flex-col justify-between bg-[#233a87] px-12 py-10">

        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <h1
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
            >
              TaskSense
            </h1>
          </div>
          <p className="text-[13px] font-medium uppercase tracking-widest text-white/50 pl-[3.25rem]">
            Academic Workspace
          </p>
        </div>

        {/* Headline */}
        <div className="my-auto py-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-4">
            Built for students
          </p>
          <h2
            className="text-4xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}
          >
            The intelligent<br />academic atelier.
          </h2>
          <p className="text-base text-white/65 leading-relaxed max-w-xs">
            A curated workspace designed to reduce cognitive load and help you
            focus on what matters — your work.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-5">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <feature.icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                <p className="text-xs text-white/55 leading-relaxed mt-0.5">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-white/30 mt-8">
          &copy; {new Date().getFullYear()} TaskSense. All rights reserved.
        </p>
      </div>

      {/* ── Right panel: Auth form on warm paper ── */}
      <div className="flex w-full lg:w-[54%] items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#233a87]">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <h1
              className="text-2xl font-bold text-[#1a1c1b]"
              style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
            >
              TaskSense
            </h1>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
