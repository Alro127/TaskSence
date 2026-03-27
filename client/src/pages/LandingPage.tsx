import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Search,
  Bell,
  Sparkles,
  LayoutGrid,
  Users,
  BarChart3,
  Quote,
  ArrowRight,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { useAppSelector } from "@/app/hooks";

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between bg-[#faf9f7] px-8">
      {/* Logo + nav */}
      <div className="flex items-center gap-8">
        <Link
          to="/"
          className="flex items-center gap-2.5"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#233a87]">
            <BookOpen className="h-4 w-4 text-white" />
          </div>
          <span
            className="text-xl font-bold tracking-tight text-[#233a87]"
            style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
          >
            TaskSense
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {["Workspace", "Project", "Sprint"].map((item, i) => (
            <a
              key={item}
              href="#features"
              className={[
                "text-sm font-medium transition-colors hover:text-[#233a87] focus:outline-none",
                i === 0 ? "font-bold text-[#233a87]" : "text-[#444651]",
              ].join(" ")}
            >
              {item}
            </a>
          ))}
        </nav>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#757682]" />
          <input
            type="text"
            placeholder="Search workspace..."
            className="w-56 rounded-lg bg-[#f4f3f1] py-1.5 pl-9 pr-4 text-sm text-[#1a1c1b] outline-none focus:ring-2 focus:ring-[#006a61] border-0"
          />
        </div>

        <button className="text-[#444651] transition-colors hover:text-[#233a87]">
          <Bell className="h-5 w-5" />
        </button>
        <button className="text-[#444651] transition-colors hover:text-[#233a87]">
          <Sparkles className="h-5 w-5" />
        </button>

        {isAuthenticated ? (
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-[#233a87] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Go to Dashboard
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/auth/login"
              className="text-sm font-semibold text-[#233a87] transition-opacity hover:opacity-70"
            >
              Sign in
            </Link>
            <Link
              to="/auth/register"
              className="rounded-lg bg-[#233a87] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const navigate = useNavigate();

  return (
    <section className="mx-auto grid max-w-7xl items-center gap-16 px-8 pb-32 pt-24 lg:grid-cols-2">
      {/* Text */}
      <div className="space-y-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#444651]">
          The Academic Atelier
        </p>
        <h1
          className="text-[3.5rem] font-bold leading-[1.1] tracking-tight text-[#233a87]"
          style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}
        >
          Your focus,{" "}
          <br />
          refined and{" "}
          <br />
          augmented.
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-[#444651]">
          A high-end curated workspace for the modern academic. Escape the noise
          and organize your research with the TaskSense Atelier.
        </p>
        <div className="flex flex-wrap gap-4 pt-4">
          <button
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth/register")}
            className="rounded-lg bg-[#233a87] px-8 py-4 text-sm font-semibold text-white transition-all hover:opacity-90 focus:ring-2 focus:ring-[#006a61] focus:outline-none"
          >
            Start for free
          </button>
          <a
            href="#features"
            className="flex items-center gap-2 rounded-lg border border-[#233a87] px-8 py-4 text-sm font-semibold text-[#233a87] transition-all hover:bg-[#f4f3f1] focus:ring-2 focus:ring-[#006a61] focus:outline-none"
          >
            See how it works
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Task board mockup */}
      <div
        aria-hidden="true"
        className="relative rounded-xl border border-[rgba(197,197,211,0.2)] bg-[#f4f3f1] p-6 shadow-sm"
      >
        {/* Window chrome */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-[rgba(186,26,26,0.2)]" />
            <div className="h-3 w-3 rounded-full bg-[rgba(100,51,0,0.2)]" />
            <div className="h-3 w-3 rounded-full bg-[rgba(0,106,97,0.2)]" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#757682]">
            Active Sprint
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            <div className="rounded-lg border border-[rgba(197,197,211,0.1)] bg-white p-4 shadow-sm">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#643300]">
                Priority: High
              </div>
              <div className="mb-2 text-sm font-semibold text-[#1a1c1b]">
                Thesis Bibliography Review
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#efeeec]">
                <div className="h-full w-2/3 rounded-full bg-[#233a87]" />
              </div>
            </div>

            <div className="rounded-lg border border-[rgba(197,197,211,0.1)] bg-white p-4 shadow-sm">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#006a61]">
                Research
              </div>
              <div className="mb-2 text-sm font-semibold text-[#1a1c1b]">
                Archive Search: 19th Century
              </div>
              <div className="flex -space-x-2">
                <div className="h-6 w-6 rounded-full border-2 border-white bg-[#dadad8]" />
                <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#3d52a0] text-[8px] font-bold text-white">
                  +2
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[rgba(197,197,211,0.1)] bg-white p-4 shadow-sm">
              <div className="mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-[#006a61]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#006a61]">
                  Done
                </span>
              </div>
              <div className="text-sm font-semibold text-[#1a1c1b]">
                Literature review outline
              </div>
            </div>
          </div>

          {/* Right column — AI insight card (slightly rotated) */}
          <div className="pt-8">
            <div className="rotate-2 rounded-lg border border-[rgba(197,197,211,0.1)] bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#006a61]" />
                <span className="text-xs font-bold text-[#006a61]">AI Insight</span>
              </div>
              <p className="text-xs italic leading-relaxed text-[#444651]">
                "Your citation density is higher than last week. Consider
                summarizing the literature review first."
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-[rgba(197,197,211,0.1)] bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#643300]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#643300]">
                  Due Today
                </span>
              </div>
              <div className="text-sm font-semibold text-[#1a1c1b]">
                Research proposal draft
              </div>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#efeeec]">
                <div className="h-full w-1/3 rounded-full bg-[#643300]/60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────
const features = [
  {
    icon: LayoutGrid,
    color: "#233a87",
    iconBg: "rgba(35,58,135,0.05)",
    title: "Workspace Management",
    description:
      "Organize projects, notes, and references in a fluid, non-linear environment designed for long-form research.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDcUhSp-HUSQ8oyUjs4c0V-P23-qWX8KkIxMbA2874Vg9_bGJcOMFN_BwNCKqBBz7hTYxAJcu88a_eHtYfbOSNVK8abZ-JelS09iRQTxGcFOTDevzrNbVWpz-PMJJVpOXVlH2jtdAB9BkicOGnPSlF-tTFULshWvZ1KxWVuJ1Q-JoRpzruydx6DxG5zAvxBij0tylfcWmtqVWTogI2B25WEzmq2ZKEBCYop80xldTJtIlANp205vVOAzAHHxgsZysm3RSNNJmno8C8",
    imageAlt: "Minimalist workspace with wooden desk and notebooks",
  },
  {
    icon: Sparkles,
    color: "#006a61",
    iconBg: "rgba(0,106,97,0.05)",
    title: "AI Engine",
    description:
      "Context-aware suggestions that identify gaps in your research and automate bibliographic formatting.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCxDcxScpE3pGz729M4Op9eZTZXYwf-OQ4xVdH_ksZqxXwXFQRP8PEOPDOZZxrXG8M8SBOd0rEYO1Yk24vLsbVBB0uEba3T84MYNCKEmf8_pQJ-fCTFIsjvealWuGs2m7P7tU60TSTkMAP7jC1P59HTrw3tUeqTdv9b1vCdyUBXQepG0qBi1xaA9b733TuN9JODXst731yH3RCoBRv3NpzAzL3LAll0mFl2BKjMIGJJVVLBUl8JG0P0kKmpViC561IWi808BgV2h3Hg",
    imageAlt: "AI neural network visualization in indigo and teal",
  },
  {
    icon: Users,
    color: "#643300",
    iconBg: "rgba(100,51,0,0.05)",
    title: "Scholarly Community",
    description:
      "Connect with peers in your discipline to share resources, peer-review drafts, and host virtual study ateliers.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAyMSBmFbmqkJ_XpXRcu9eQbB1yrio3L3BY8-YcfiDy923u7e25I5orJ41pNh2iPMXmWZD8Ee4txTgwSvZVg58Z30c8BUwaUEd1Sf0idrjC-Wc_CZHkl0NGoXy7xy6gmUItCaGqyVRPiRFk3RtTRiHpMg2d0z_liCxbID9-jVltcqFFmsz1gRntJySqRGcVjgDaVKKStJAVnJZMWxPMIom3PDtrKlfLSc8O5JJ4H_vrO9lHiLvp0GDDzgnaPs7KGqvJAHXLY6fNQiA",
    imageAlt: "Students collaborating in a sunlit library",
  },
  {
    icon: BarChart3,
    color: "#233a87",
    iconBg: "rgba(35,58,135,0.05)",
    title: "Cognitive Analytics",
    description:
      "Track your focus cycles and output trends with deep-dive analytics that value quality over quantity.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAoqWrfwkoayF0lA0mdpZsxRca536v6ogDWLjQSlHRNpA0ZevFb9xMgT-ALjnNOlAtI8JbUwffQZa9SHyPjMeAuRw0OPCEWG2QuledDhyK_a0uicHh5QmsrYqFd5a3tlxiKezgbbQEnvRbEB40Em3loaP8-MiY1H_fdlxuR0pIdIWubYwynCm0DYHaYB-1K6bnHTFpkS_6elWSvvZB3I6JllrTPbEw8q4MFtQADP8zKWniVUUC7pF_1wMo2v-lAWnT_bz7akS8CYvQ",
    imageAlt: "Sophisticated data visualization dashboard",
  },
];

function Features() {
  return (
    <section id="features" className="overflow-hidden bg-[#f4f3f1] py-24">
      <div className="mx-auto mb-16 max-w-7xl px-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#444651]">
          What we offer
        </p>
        <h2
          className="mb-4 text-3xl font-bold tracking-tight text-[#233a87]"
          style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.01em" }}
        >
          Tailored for Intellectual Clarity
        </h2>
        <p className="max-w-xl text-[#444651]">
          Move beyond standard task lists. TaskSense provides the specialized tools
          required for deep focus and structured academic output.
        </p>
      </div>

      <div className="hide-scrollbar flex snap-x gap-8 overflow-x-auto px-8 pb-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article
              key={feature.title}
              className="flex min-w-[400px] snap-center flex-col justify-between rounded-xl bg-white p-8 shadow-sm md:min-w-[580px]"
            >
              <div>
                <div
                  className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: feature.iconBg }}
                >
                  <Icon className="h-5 w-5" style={{ color: feature.color }} />
                </div>
                <h3
                  className="mb-4 text-2xl font-bold text-[#233a87]"
                  style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
                >
                  {feature.title}
                </h3>
                <p className="mb-8 leading-relaxed text-[#444651]">
                  {feature.description}
                </p>
              </div>
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-[#efeeec]">
                <img
                  src={feature.image}
                  alt={feature.imageAlt}
                  className="h-full w-full object-cover transition-all duration-500 hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ─── Testimonial ──────────────────────────────────────────────────────────────
function Testimonial() {
  return (
    <section className="mx-auto max-w-4xl px-8 py-24 text-center">
      <Quote className="mx-auto mb-8 h-12 w-12 text-[#233a87]" />
      <blockquote
        className="mb-8 text-3xl font-bold italic leading-tight text-[#233a87]"
        style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.01em" }}
      >
        "TaskSense transformed my dissertation workflow from chaotic sticky notes
        to a structured, elegant system that actually understands my research
        goals."
      </blockquote>
      <cite className="not-italic">
        <span className="block font-bold text-[#233a87]">Dr. Julian Thorne</span>
        <span className="mt-1 block text-sm uppercase tracking-widest text-[#444651]">
          Department of Comparative Literature
        </span>
      </cite>
    </section>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────
const stats = [
  { value: "15,000+", label: "Active researchers" },
  { value: "98%", label: "Focus satisfaction" },
  { value: "3×", label: "Faster task completion" },
  { value: "40+", label: "University partners" },
];

// ─── CTA section ─────────────────────────────────────────────────────────────
function CTASection() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const navigate = useNavigate();

  return (
    <section className="px-8 py-32">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#233a87] p-16 text-center">
        {/* Decorative blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute -mr-48 -mt-48 right-0 top-0 h-96 w-96 rounded-full bg-[#006a61]" />
          <div className="absolute -mb-32 -ml-32 bottom-0 left-0 h-64 w-64 rounded-full bg-[#643300]" />
        </div>

        <div className="relative z-10">
          {/* Stats */}
          <div className="mx-auto mb-16 grid max-w-2xl grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-3xl font-bold text-white"
                  style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
                >
                  {stat.value}
                </div>
                <div className="mt-1 text-xs text-white/50 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <h2
            className="mb-6 text-4xl font-bold tracking-tight text-white md:text-5xl"
            style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.02em" }}
          >
            Ready to master your workspace?
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-lg text-white/65">
            Join researchers and students building their academic future on
            TaskSense.
          </p>
          <button
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth/register")}
            className="rounded-lg bg-[#86f2e4] px-12 py-5 text-lg font-bold text-[#00201d] transition-transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-white/20"
          >
            {isAuthenticated ? "Go to Dashboard" : "Start for free"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
const footerLinks = {
  Platform: ["Workspace", "AI Engine", "Analytics"],
  Community: ["Forum", "Shared Libraries", "Peer Review"],
  Company: ["Philosophy", "Privacy", "Contact"],
};

function Footer() {
  return (
    <footer className="bg-[#f4f3f1] px-8 py-16">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-12 md:grid-cols-4">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <span
            className="mb-6 block text-xl font-bold tracking-tight text-[#233a87]"
            style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}
          >
            TaskSense
          </span>
          <p className="text-sm leading-relaxed text-[#444651]">
            The high-end workspace for critical thinkers, designed with the
            precision of an academic atelier.
          </p>
        </div>

        {/* Link columns */}
        {Object.entries(footerLinks).map(([section, links]) => (
          <div key={section}>
            <h4 className="mb-6 text-xs font-bold uppercase tracking-widest text-[#233a87]">
              {section}
            </h4>
            <ul className="space-y-4 text-sm text-[#444651]">
              {links.map((link) => (
                <li key={link}>
                  <a href="#" className="transition-colors hover:text-[#233a87]">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="mx-auto mt-16 max-w-7xl border-t border-[rgba(197,197,211,0.15)] pt-8 flex flex-col items-center justify-between gap-4 text-[10px] uppercase tracking-[0.2em] text-[#757682] md:flex-row">
        <span>© {new Date().getFullYear()} TaskSense Academic Atelier. All rights reserved.</span>
        <div className="flex gap-8">
          <a href="#" className="hover:text-[#233a87] transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-[#233a87] transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#faf9f7] text-[#1a1c1b]">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Testimonial />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
