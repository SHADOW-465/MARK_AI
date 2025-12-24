/**
 * Google Drive Utility Library
 * Handles parsing Drive URLs, fetching metadata, and downloading content.
 */

// Regex patterns for various Google Drive URL formats
const DRIVE_URL_PATTERNS = [
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
    /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
    /https:\/\/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/,
]

/**
 * Extracts the file ID from a Google Drive share URL.
 */
export function extractFileId(url: string): string | null {
    for (const pattern of DRIVE_URL_PATTERNS) {
        const match = url.match(pattern)
        if (match && match[1]) {
            return match[1]
        }
    }
    return null
}

/**
 * Fetches file metadata from Google Drive using the API key (for public files).
 */
export async function getFileMetadata(fileId: string, apiKey: string) {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size&key=${apiKey}`

    const response = await fetch(url)

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || "Failed to fetch file metadata")
    }

    return response.json() as Promise<{
        id: string
        name: string
        mimeType: string
        size: string
    }>
}

/**
 * Downloads file content from Google Drive.
 * Works for publicly shared files using the export/download endpoint.
 */
export async function downloadFileContent(fileId: string, apiKey: string): Promise<ArrayBuffer> {
    // For Google Docs/Sheets/Slides, we need to export as PDF
    // For regular files, we use the download endpoint
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`

    const response = await fetch(downloadUrl)

    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`)
    }

    return response.arrayBuffer()
}

/**
 * Generates a direct view URL for embedding in the UI.
 */
export function getPreviewUrl(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/preview`
}

/**
 * Generates a thumbnail URL for images/documents.
 */
export function getThumbnailUrl(fileId: string): string {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`
}
