import { Sparkles, Play, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WorkflowGuidanceDto } from "@/types/api";

interface ProjectGuidanceCardProps {
  guidance: WorkflowGuidanceDto;
  onStartGuidance: () => void;
}

export function ProjectGuidanceCard({ guidance, onStartGuidance }: ProjectGuidanceCardProps) {
  const { summary } = guidance;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside className="ghost-border rounded-xl bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(0,106,97,0.08)]">
            <Sparkles className="h-4.5 w-4.5 text-[#006a61]" />
          </div>
          <div>
            <h3
              className="text-sm font-bold text-[#1a1c1b]"
              style={{ fontFamily: "'Epilogue', 'Inter', sans-serif", letterSpacing: "-0.01em" }}
            >
              AI Guidance
            </h3>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Strategic Tips</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 hover:bg-muted"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      <div className={cn(
        "grid transition-all duration-300 ease-in-out",
        isExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden">
          <p className="text-xs leading-relaxed text-[#444651] mb-4 bg-muted/30 p-2.5 rounded-lg border border-border/50">
            {summary.overview}
          </p>

          <div className="space-y-4">
            {summary.bestPractices.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#006a61] flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" />
                  Best Practices
                </h4>
                <ul className="space-y-1">
                  {summary.bestPractices.slice(0, 2).map((bp, i) => (
                    <li key={i} className="text-[11px] text-[#444651] pl-4 relative before:content-[''] before:absolute before:left-1 before:top-1.5 before:w-1 before:h-1 before:bg-[#006a61]/40 before:rounded-full">
                      {bp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summary.risks.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#643300] flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" />
                  Risks
                </h4>
                <ul className="space-y-1">
                  {summary.risks.slice(0, 2).map((risk, i) => (
                    <li key={i} className="text-[11px] text-[#444651] pl-4 relative before:content-[''] before:absolute before:left-1 before:top-1.5 before:w-1 before:h-1 before:bg-[#643300]/40 before:rounded-full">
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          className="flex-1 h-8 text-[11px] bg-[#006a61] text-white hover:opacity-90"
          onClick={onStartGuidance}
        >
          <Play className="mr-1.5 h-3 w-3" />
          Restart Tour
        </Button>
        {!isExpanded && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-[11px]"
            onClick={() => setIsExpanded(true)}
          >
            Details
          </Button>
        )}
      </div>
    </aside>
  );
}
