import { useState } from "react";
import { Sparkles, Loader2, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RegenerateGuidanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (userInstructions: string) => Promise<void>;
  isLoading: boolean;
  isRegenerating: boolean;
}

export function RegenerateGuidanceDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  isRegenerating,
}: RegenerateGuidanceDialogProps) {
  const [instructions, setInstructions] = useState("");

  const handleConfirm = async () => {
    await onConfirm(instructions);
    setInstructions("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#233a87]" />
            {isRegenerating ? "Regenerate AI Guidance" : "Generate AI Guidance"}
          </DialogTitle>
          <DialogDescription>
            AI will analyze your workflow steps and create interactive onboarding guidance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#444651]">
              Custom Instructions (Optional)
            </label>
            <Textarea
              placeholder="e.g., 'Focus more on technical implementation', 'Add a step for security review', 'Explain why each step is important'..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              className="resize-none border-[#efeeec] focus-visible:ring-[#233a87]"
            />
            <p className="flex items-start gap-1.5 text-[10px] text-[#444651]">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              Provide specific notes to guide the AI in generating more relevant instructions for your workflow.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            className="bg-[#233a87] text-white hover:opacity-90"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isRegenerating ? "Regenerate" : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
