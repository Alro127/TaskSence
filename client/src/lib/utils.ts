import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts a human-readable error message from an RTK Query error.
 * Backend error shape: { status: number, message: string, timestamp: string }
 * The parsed body is available at `error.data`.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred. Please try again."
): string {
  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>
    // RTK Query FetchBaseQueryError: error.data is the parsed response body
    if (err.data && typeof err.data === "object") {
      const data = err.data as Record<string, unknown>
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message
      }
    }
    // Serialized error with a message field directly
    if (typeof err.message === "string" && err.message.trim()) {
      return err.message
    }
  }
  return fallback
}
