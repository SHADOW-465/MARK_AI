import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Truncates text to a maximum length and provides a fallback message if empty.
 * Used for AI Context Windows (Gemini).
 */
export function truncateContext(text: string | null | undefined, maxLength: number = 10000): string {
    if (!text || text.trim().length === 0) {
        return "I am answering from general knowledge as your file is still being processed or has no readable text.";
    }

    if (text.length <= maxLength) {
        return text;
    }

    return text.substring(0, maxLength) + "\n...[Content Truncated due to length]...";
}
