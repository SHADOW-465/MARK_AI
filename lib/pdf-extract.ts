/**
 * PDF Text Extraction Utility
 * Extracts text content from PDF files for AI context
 */

// pdf-parse doesn't have ESM exports, use dynamic import
const pdfParse = require('pdf-parse')

/**
 * Extracts text from a PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        const data = await pdfParse(buffer)
        return data.text || '[No text content found in PDF]'
    } catch (error) {
        console.error('PDF extraction error:', error)
        return '[PDF text extraction failed - may be image-based]'
    }
}

/**
 * Extracts text from a PDF URL (downloads and parses)
 */
export async function extractTextFromPDFUrl(url: string): Promise<string> {
    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        return extractTextFromPDF(buffer)
    } catch (error) {
        console.error('PDF URL extraction error:', error)
        return '[Failed to extract text from PDF URL]'
    }
}

/**
 * Checks if a file is a PDF based on extension or mime type
 */
export function isPDF(fileName: string, mimeType?: string): boolean {
    if (mimeType === 'application/pdf') return true
    return fileName.toLowerCase().endsWith('.pdf')
}
