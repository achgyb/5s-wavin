/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GOOGLE DRIVE SERVICE
 * Upload photos to Google Drive and return a publicly-viewable URL.
 *
 * Flow:
 *   1. User captures/selects photo (File object or base64)
 *   2. uploadPhoto(file, fileName) → uploads to Drive folder
 *   3. Returns { fileId, viewUrl } for storage in Sheets
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { GOOGLE_CONFIG } from '../config/google';
import { getValidToken } from './googleAuth';

const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_FILES_BASE = 'https://www.googleapis.com/drive/v3/files';

/**
 * Upload a photo File object to Google Drive.
 * @param {File} file - The image File from an <input type="file"> or camera
 * @param {string} fileName - Desired filename (e.g. "RT-12345_photo.jpg")
 * @returns {{ fileId: string, viewUrl: string, thumbnailUrl: string }}
 */
export async function uploadPhoto(file, fileName) {
  const token = await getValidToken();

  // ── Step 1: Create file metadata ─────────────────────────────────────────
  const metadata = {
    name: fileName,
    parents: [GOOGLE_CONFIG.DRIVE_FOLDER_ID],
    mimeType: file.type || 'image/jpeg',
  };

  // ── Step 2: Multipart upload (metadata + file data) ──────────────────────
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataStr = JSON.stringify(metadata);

  // Convert file to ArrayBuffer
  const fileArrayBuffer = await file.arrayBuffer();

  // Build multipart body
  const encoder = new TextEncoder();
  const metaPart = encoder.encode(
    `${delimiter}Content-Type: application/json\r\n\r\n${metadataStr}${delimiter}Content-Type: ${file.type}\r\n\r\n`
  );
  const closePart = encoder.encode(closeDelimiter);

  const body = new Uint8Array(metaPart.length + fileArrayBuffer.byteLength + closePart.length);
  body.set(metaPart, 0);
  body.set(new Uint8Array(fileArrayBuffer), metaPart.length);
  body.set(closePart, metaPart.length + fileArrayBuffer.byteLength);

  const uploadRes = await fetch(
    `${DRIVE_UPLOAD_BASE}?uploadType=multipart&fields=id,name,webViewLink,thumbnailLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json();
    throw new Error(`Drive upload failed: ${err.error?.message || uploadRes.statusText}`);
  }

  const fileData = await uploadRes.json();

  // ── Step 3: Make the file publicly viewable (anyone with link = reader) ──
  await fetch(
    `${DRIVE_FILES_BASE}/${fileData.id}/permissions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    }
  );

  // Direct image URL for embedding
  const viewUrl = `https://lh3.googleusercontent.com/d/${fileData.id}`;
  const thumbnailUrl = fileData.thumbnailLink || viewUrl;

  return {
    fileId: fileData.id,
    viewUrl,
    thumbnailUrl,
    webViewLink: fileData.webViewLink,
  };
}

/**
 * Generate a unique filename for a photo.
 * @param {string} prefix - e.g. "RT" or "AUDIT"
 * @param {string} id - Record ID
 * @param {string} mimeType - File MIME type
 */
export function generatePhotoFilename(prefix, id, mimeType = 'image/jpeg') {
  const ext = mimeType.split('/')[1] || 'jpg';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}_${id}_${timestamp}.${ext}`;
}

/**
 * Convert a base64 data URL to a File object.
 * Useful if you're using canvas or webcam capture.
 */
export function dataUrlToFile(dataUrl, filename) {
  const [header, base64Data] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)[1];
  const byteString = atob(base64Data);
  const buffer = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    buffer[i] = byteString.charCodeAt(i);
  }
  return new File([buffer], filename, { type: mimeType });
}
