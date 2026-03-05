/**
 * Universal AI Engineering Framework - Central Tokens Registry
 */

import { spacingTokens } from "./spacing";
import { typographyTokens } from "./typography";
import { colorRoles } from "./theme";

export const designTokens = {
    spacing: spacingTokens,
    typography: typographyTokens,
    colors: colorRoles,
} as const;

export { spacingTokens, typographyTokens, colorRoles };
export * from "./spacing";
export * from "./typography";
export * from "./theme";
