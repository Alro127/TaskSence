import { type KeyboardEvent, useId, useState } from "react";
import { Loader2, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStars?: number;
  initialReviewText?: string;
  onSubmit: (payload: { stars: number; reviewText?: string }) => Promise<void> | void;
  isSubmitting: boolean;
  isGuest: boolean;
  isOwner: boolean;
}

const REVIEW_TEXT_MAX = 500;

export function RatingDialog({
  open,
  onOpenChange,
  initialStars,
  initialReviewText,
  onSubmit,
  isSubmitting,
  isGuest,
  isOwner,
}: RatingDialogProps) {
  const [stars, setStars] = useState(initialStars ?? 0);
  const [reviewText, setReviewText] = useState(initialReviewText ?? "");
  const [hoverStars, setHoverStars] = useState(0);
  const reviewId = useId();
  const disabledReason = isGuest
    ? "Please sign in to rate this workflow."
    : isOwner
      ? "You cannot rate your own workflow."
      : null;

  const resetForm = () => {
    setStars(initialStars ?? 0);
    setReviewText(initialReviewText ?? "");
    setHoverStars(0);
  };

  const effectiveStars = hoverStars || stars;

  const handleStarKeyDown = (event: KeyboardEvent<HTMLButtonElement>, value: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setStars(value);
      return;
    }

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setStars((prev) => Math.min(5, Math.max(1, prev || value) + 1));
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setStars((prev) => Math.max(1, (prev || value) - 1));
    }
  };

  const handleSubmit = async () => {
    if (disabledReason || stars < 1 || stars > 5) {
      return;
    }

    await onSubmit({
      stars,
      reviewText: reviewText.trim() || undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        resetForm();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Epilogue', 'Inter', sans-serif" }}>
            Rate this Workflow
          </DialogTitle>
          <DialogDescription>
            Share a quick score and optional feedback to help others discover quality workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[#444651]">Your rating</p>
            <div role="radiogroup" aria-label="Rate workflow from 1 to 5 stars" className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                const isFilled = value <= effectiveStars;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={stars === value}
                    aria-label={`${value} star${value !== 1 ? "s" : ""}`}
                    className="rounded-md p-1.5 text-[#444651] outline-none transition-colors hover:text-[#643300] focus-visible:ring-2 focus-visible:ring-[#006a61]"
                    onMouseEnter={() => setHoverStars(value)}
                    onMouseLeave={() => setHoverStars(0)}
                    onClick={() => setStars(value)}
                    onKeyDown={(event) => handleStarKeyDown(event, value)}
                    disabled={Boolean(disabledReason) || isSubmitting}
                  >
                    <Star className={cn("h-6 w-6", isFilled ? "fill-[#643300] text-[#643300]" : "")} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor={reviewId} className="text-xs font-semibold uppercase tracking-widest text-[#444651]">
              Optional review
            </label>
            <Textarea
              id={reviewId}
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value.slice(0, REVIEW_TEXT_MAX))}
              maxLength={REVIEW_TEXT_MAX}
              placeholder="What did you like or what could be improved?"
              className="min-h-24"
              disabled={Boolean(disabledReason) || isSubmitting}
            />
            <p className="text-right text-xs text-[#444651]">
              {reviewText.length}/{REVIEW_TEXT_MAX}
            </p>
          </div>

          {disabledReason && (
            <p className="rounded-md border border-[rgba(186,26,26,0.2)] bg-[rgba(186,26,26,0.06)] px-3 py-2 text-xs text-[#ba1a1a]">
              {disabledReason}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#233a87] text-white hover:opacity-90"
            onClick={() => void handleSubmit()}
            disabled={Boolean(disabledReason) || isSubmitting || stars < 1}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit rating
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
