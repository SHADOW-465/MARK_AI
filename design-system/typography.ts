/**
 * Universal AI Engineering Framework - Typography Tokens
 * 
 * Rules:
 * typography_levels: [ "PageTitle", "SectionTitle", "CardTitle", "BodyText", "MetaText" ]
 */

export const typographyTokens = {
    PageTitle: "text-4xl font-extrabold tracking-tight lg:text-5xl",
    SectionTitle: "text-3xl font-semibold tracking-tight transition-colors",
    CardTitle: "text-xl font-semibold tracking-tight",
    BodyText: "text-base leading-7",
    MetaText: "text-sm text-muted-foreground",
} as const;

export type TypographyToken = keyof typeof typographyTokens;

/**
 * Helper to get the Tailwind classes for a typography level
 */
export const getTypography = (token: TypographyToken) => typographyTokens[token];
