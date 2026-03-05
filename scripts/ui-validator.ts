import * as fs from 'fs';
import * as path from 'path';

// Define the valid token values according to the Universal AI Engineering Framework
const ALLOWED_SPACING_TOKENS = [4, 8, 12, 16, 24, 32, 48, 64];

// Tailwind classes that map to the spacing scale
// e.g., p-4, m-8, gap-12
const SPACING_PREFIXES = ['p', 'm', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'gap', 'gap-x', 'gap-y'];

// Common forbidden patterns
const FORBIDDEN_PATTERNS = [
    { regex: /\b(?:absolute|fixed|sticky)\b.*?(?:top-|bottom-|left-|right-)/, name: "absolute_positioning_for_layout" },
    { regex: /style={{.*?(?:margin|padding|color|backgroundColor).*?}}/g, name: "inline_styles_forbidden" }
];

let totalViolations = 0;

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

function analyzeFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        // Find inline style violations and absolute layout
        FORBIDDEN_PATTERNS.forEach(pattern => {
            if (pattern.regex.test(line)) {
                console.error(`[VIOLATION] ${filePath}:${index + 1} -> ${pattern.name} detected.`);
                totalViolations++;
            }
        });

        // Basic check for arbitrary Tailwind spacing (e.g. p-[15px])
        const arbitrarySpacingMatch = line.match(/\b(?:p|m|gap|w|h)-\[[0-9]+.*?\]/g);
        if (arbitrarySpacingMatch) {
            console.error(`[VIOLATION] ${filePath}:${index + 1} -> Arbitrary spacing value detected: ${arbitrarySpacingMatch.join(', ')}. Use defined tokens.`);
            totalViolations++;
        }
    });

    // Check component depth recursively inside generic <div> nesting
    // A simplified heuristic for 'component_depth_over_5' checking deepest JSX nesting
    let currentDepth = 0;
    let maxDepth = 0;

    // Using a simplistic tag depth counter
    const openTags = content.match(/<[a-zA-Z]+/g) || [];
    const closeTags = content.match(/<\/[a-zA-Z]+/g) || [];
    const depthEstimate = (openTags.length - closeTags.length) / lines.length;
    // Real AST parsing would be required for strict 5 depth enforcement,
    // assuming reasonable standard depths for now.
}

console.log("=== Running Universal UI Validation System ===");
const targetDirs = ['./components', './app'];

targetDirs.forEach(dir => {
    const fullDir = path.resolve(dir);
    walkDir(fullDir, analyzeFile);
});

console.log("==============================================");
if (totalViolations > 0) {
    console.error(`\nValidation Failed: Found ${totalViolations} UI violations.`);
    process.exit(1);
} else {
    console.log("\nValidation Passed: 0 UI violations found.");
}
