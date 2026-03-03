import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export const LEVEL_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Elementary",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
};

interface SkillStarsProps {
  /** Current level value (1–5) */
  value: number;
  /** If provided, stars become interactive (clickable) */
  onChange?: (value: number) => void;
  size?: "sm" | "default";
  /** Show the text label next to the stars */
  showLabel?: boolean;
}

/**
 * Displays a 1–5 star rating for a skill level.
 * When `onChange` is provided the stars are interactive.
 */
export function SkillStars({
  value,
  onChange,
  size = "default",
  showLabel = false,
}: SkillStarsProps) {
  const starSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const isInteractive = Boolean(onChange);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            onClick={() => onChange?.(star)}
            aria-label={`Set level to ${star}`}
            className={cn(
              "rounded-sm transition-transform focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              isInteractive
                ? "cursor-pointer hover:scale-110"
                : "cursor-default"
            )}
          >
            <Star
              className={cn(
                starSize,
                "transition-colors",
                star <= value
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {LEVEL_LABELS[value]}
        </span>
      )}
    </div>
  );
}
