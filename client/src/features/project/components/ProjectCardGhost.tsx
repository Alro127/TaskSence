import { Plus } from "lucide-react";

interface ProjectCardGhostProps {
  onClick: () => void;
}

export function ProjectCardGhost({ onClick }: ProjectCardGhostProps) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[130px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(197,197,211,0.5)] bg-[#faf9f7] text-[#444651] transition-all hover:border-[#233a87]/40 hover:bg-[rgba(35,58,135,0.04)] hover:text-[#233a87]"
    >
      <Plus className="h-5 w-5" />
      <span className="text-sm font-medium">New Project</span>
    </button>
  );
}
