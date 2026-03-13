import type { TagResponse } from "@/types/api";
import { cn } from "@/lib/utils";
import { hexToRgba, isValidHexColor } from "../constants/tagPalette";

interface TagBadgeProps {
  tag: Pick<TagResponse, "name" | "color">;
  className?: string;
}

export function TagBadge({ tag, className }: TagBadgeProps) {
  if (!isValidHexColor(tag.color)) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground",
          className,
        )}
      >
        {tag.name}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        color: tag.color,
        borderColor: hexToRgba(tag.color, 0.35),
        backgroundColor: hexToRgba(tag.color, 0.12),
      }}
    >
      {tag.name}
    </span>
  );
}
