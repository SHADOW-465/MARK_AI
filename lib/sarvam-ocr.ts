/**
 * Sarvam AI OCR Service
 *
 * Routes files to the correct text extractor:
 *   Images (JPG/PNG/WEBP)  → Sarvam AI  (Indian scripts + handwriting)
 *   PDFs with text layer   → pdf-parse  (fast, free)
 *   Scanned PDFs           → Sarvam AI  (fallback when pdf-parse yields < 20 chars)
 *   TXT / MD               → file.text() (direct)
 *
 * Sarvam API ref: https://docs.sarvam.ai/api-reference/ocr
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse")

export type OcrResult = {
    text: string
    method: "sarvam" | "pdf-parse" | "direct" | "none"
}

function isImage(file: File): boolean {
    return ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)
}

async function extractFromPdf(buffer: ArrayBuffer): Promise<string> {
    try {
        const data = await pdf(Buffer.from(buffer))
        return data.text || ""
    } catch {
        return ""
    }
}

async function extractWithSarvam(file: File): Promise<string> {
    const apiKey = process.env.SARVAM_API_KEY
    if (!apiKey) {
        console.warn("[sarvam-ocr] SARVAM_API_KEY not set — skipping Sarvam OCR")
        return ""
    }

    try {
        const arrayBuffer = await file.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString("base64")

        const response = await fetch("https://api.sarvam.ai/v1/ocr", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-subscription-key": apiKey,
            },
            body: JSON.stringify({
                image: base64,
                language_code: "auto", // auto-detects script/language
            }),
        })

        if (!response.ok) {
            console.error("[sarvam-ocr] API error:", response.status, await response.text())
            return ""
        }

        const data = await response.json()
        // Sarvam response: { text: string, language: string }
        return data.text || ""
    } catch (err) {
        console.error("[sarvam-ocr] exception:", err)
        return ""
    }
}

/**
 * Main entry point. Call this with any uploaded File object.
 * Returns { text, method } — text is empty string if extraction failed.
 */
export async function extractTextFromFile(file: File): Promise<OcrResult> {
    const name = file.name.toLowerCase()

    // Plain text — read directly, no OCR needed
    if (name.endsWith(".txt") || name.endsWith(".md")) {
        const text = await file.text()
        return { text, method: "direct" }
    }

    // PDF — try pdf-parse first (fast, no API cost)
    if (name.endsWith(".pdf")) {
        const buffer = await file.arrayBuffer()
        const text = await extractFromPdf(buffer)
        if (text.trim().length > 20) {
            return { text, method: "pdf-parse" }
        }
        // Scanned PDF (text layer empty) → fall through to Sarvam
        const sarvamText = await extractWithSarvam(file)
        return { text: sarvamText, method: "sarvam" }
    }

    // Images → Sarvam (handles all Indian scripts + handwriting)
    if (isImage(file)) {
        const text = await extractWithSarvam(file)
        return { text, method: "sarvam" }
    }

    // Unknown file type
    return { text: "", method: "none" }
}
