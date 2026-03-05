/**
 * Universal AI Engineering Framework - Theme Colors
 * 
 * Rules:
 * color_roles: [ "primary", "secondary", "background", "surface", "border", "textPrimary", "textSecondary", "success", "warning", "error" ]
 */

export const colorRoles = {
    primary: "var(--primary)",
    secondary: "var(--secondary)",
    background: "var(--background)",
    surface: "var(--card)", // Mapping surface to card
    border: "var(--border)",
    textPrimary: "var(--foreground)",
    textSecondary: "var(--muted-foreground)",
    success: "hsl(var(--success, 142.1 76.2% 36.3%))", // Standardized success green if not in theme
    warning: "hsl(var(--warning, 38 92% 50%))",         // Standardized warning orange
    error: "var(--destructive)",                        // Mapping error to destructive
} as const;

export type ColorRoleToken = keyof typeof colorRoles;

/**
 * Helper to generate CSS for color roles
 */
export const getColor = (token: ColorRoleToken) => colorRoles[token];
