import * as fs from 'fs';
import * as path from 'path';

console.log("=== Universal AI Engineering: Self-Healing UI System ===");

// Regex patterns for auto-fixing
const ARBITRARY_SPACING_REGEX = /\b([pm]|gap|w|h)-\[([0-9]+)(px|rem|em)\]/g;
const INLINE_COLOR_REGEX = /style={{.*?color:\s*['"](#[0-9a-fA-F]+|(?:rgb|hsl).*?)['"].*?}}/g;

// Allowed spacing scale
const SPACING_SCALE = [4, 8, 12, 16, 24, 32, 48, 64];

function getClosestToken(value: number): number {
    return SPACING_SCALE.reduce((prev, curr) =>
        Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
}

// Convert arbitrary pixel values to closest tailwind spacing scale
// e.g. p-[15px] -> p-4 (since 4 * 4px = 16px closest)
function fixArbitrarySpacing(content: string): string {
    return content.replace(ARBITRARY_SPACING_REGEX, (match, prefix, value, unit) => {
        if (unit === 'px') {
            const numVal = parseInt(value, 10);
            const tokenValue = getClosestToken(numVal);
            // tailwind spacing is pixel value / 4
            const tailwindClassVal = tokenValue / 4;
            return `${prefix}-${tailwindClassVal}`;
        }
        return match; // Too complex to heal non-px without AST and context right now
    });
}

// Convert inline colors to design system tokens
function fixInlineColors(content: string): string {
    // This is a naive implementation; safely converting complex inline colors 
    // to tailwind requires strict mappings. We map common ones.
    return content.replace(INLINE_COLOR_REGEX, (match) => {
        // Find if it's an inline style only setting color
        if (match.includes("color:") && match.split(",").length === 1) {
            // Replace with Tailwind text-primary class in the className attribute 
            // (Note: full healing requires AST. This removes the inline style and 
            // relies on the developer adding the correct class manually if it broke, 
            // but normally we'd inject 'text-primary' into the className).
            return match.replace(/color:\s*['"].*?['"],?/, "");
        }
        return match;
    });
}

function healFile(filePath: string) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    content = fixArbitrarySpacing(content);
    content = fixInlineColors(content);

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`[HEALED] ${filePath} - Removed arbitrary values & inline styles.`);
    }
}

function walkDir(dir: string, callback: (filePath: string) => void) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath, callback);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx')) {
            callback(fullPath);
        }
    }
}

const targetDirs = ['./components', './app'];

targetDirs.forEach(dir => {
    const fullDir = path.resolve(dir);
    walkDir(fullDir, healFile);
});

console.log("Healing complete.");
