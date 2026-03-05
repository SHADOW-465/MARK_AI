/**
 * Universal AI Engineering Framework - Spacing Tokens
 * 
 * Rules:
 * spacing_scale: [4, 8, 12, 16, 24, 32, 48, 64]
 */

export const spacingTokens = {
    // Using Tailwind CSS semantic names mapped to explicit pixel/rem values based on the required scale
    xs: "4px",   // 0.25rem
    sm: "8px",   // 0.5rem
    md: "12px",  // 0.75rem
    lg: "16px",  // 1rem
    xl: "24px",  // 1.5rem
    "2xl": "32px", // 2rem
    "3xl": "48px", // 3rem
    "4xl": "64px", // 4rem
} as const;

export type SpacingToken = keyof typeof spacingTokens;

/**
 * Helper to get pixel value for styling if needed outside Tailwind
 */
export const getSpacing = (token: SpacingToken) => spacingTokens[token];
