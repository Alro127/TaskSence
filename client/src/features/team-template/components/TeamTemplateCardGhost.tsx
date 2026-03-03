import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";

interface TeamTemplateCardGhostProps {
  onClick: () => void;
}

export function TeamTemplateCardGhost({ onClick }: TeamTemplateCardGhostProps) {
  return (
    <Card
      onClick={onClick}
      className="flex min-h-[120px] cursor-pointer items-center justify-center rounded-lg border-dashed bg-muted/30 transition-colors hover:bg-muted/50"
    >
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Plus className="h-5 w-5" />
        <span className="text-sm font-medium">New Template</span>
      </div>
    </Card>
  );
}
