/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GOOGLE DRIVE SERVICE
 * Upload photos to Google Drive and return a viewable URL.
 * Supports:
 *   1. Google Apps Script Web App (No client OAuth login required)
 *   2. Direct Google Drive API (if OAuth token available)
 *   3. Fallback to local Object URL
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { GOOGLE_CONFIG } from '../config/google';
import { getValidToken, isSignedIn } from './googleAuth';

const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_FILES_BASE = 'https://www.googleapis.com/drive/v3/files';

/**
 * Upload a photo File object to Google Drive.
 * @param {File} file - The image File from an <input type="file"> or camera
 * @param {string} fileName - Desired filename (e.g. "RT-12345_photo.jpg")
 * @returns {{ fileId: string, viewUrl: string, thumbnailUrl: string }}
 */
export async function uploadPhoto(file, fileName) {
  const actualFileName = fileName || `5S_Photo_${Date.now()}.jpg`;

  // ── Method 1: Upload via Apps Script Web App (Recommended - no login needed) ──
  if (GOOGLE_CONFIG.APPS_SCRIPT_URL) {
    try {
      return await uploadViaAppsScript(file, actualFileName);
    } catch (gasErr) {
      console.warn('Apps Script photo upload failed, attempting fallback:', gasErr);
      // If direct OAuth is active, proceed to method 2; otherwise throw
      if (!isSignedIn()) {
        throw new Error(`Upload gagal via Apps Script: ${gasErr.message}`);
      }
    }
  }

  // ── Method 2: Direct Drive v3 Upload with OAuth Token ─────────────────────
  if (isSignedIn()) {
    try {
      const token = await getValidToken();

      const metadata = {
        name: actualFileName,
        parents: GOOGLE_CONFIG.DRIVE_FOLDER_ID ? [GOOGLE_CONFIG.DRIVE_FOLDER_ID] : [],
        mimeType: file.type || 'image/jpeg',
      };

      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;
      const metadataStr = JSON.stringify(metadata);
      const fileArrayBuffer = await file.arrayBuffer();

      const encoder = new TextEncoder();
      const metaPart = encoder.encode(
        `${delimiter}Content-Type: application/json\r\n\r\n${metadataStr}${delimiter}Content-Type: ${file.type || 'image/jpeg'}\r\n\r\n`
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

      // Make publicly viewable
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
      ).catch(() => {});

      const viewUrl = `https://lh3.googleusercontent.com/d/${fileData.id}`;
      return {
        fileId: fileData.id,
        viewUrl,
        thumbnailUrl: fileData.thumbnailLink || viewUrl,
        webViewLink: fileData.webViewLink,
      };
    } catch (directErr) {
      console.error('Direct Drive API upload error:', directErr);
      throw directErr;
    }
  }

  // ── Method 3: Local Fallback (Preview only) ────────────────────────────────
  const localUrl = URL.createObjectURL(file);
  return {
    fileId: `local_${Date.now()}`,
    viewUrl: localUrl,
    thumbnailUrl: localUrl,
  };
}

/**
 * Upload file through Google Apps Script backend as Base64.
 */
function uploadViaAppsScript(file, fileName) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result;
        const base64Data = dataUrl.split(',')[1];
        
        const payload = {
          action: 'uploadPhoto',
          fileName: fileName,
          mimeType: file.type || 'image/jpeg',
          base64: base64Data,
          folderId: GOOGLE_CONFIG.DRIVE_FOLDER_ID,
        };

        const res = await fetch(GOOGLE_CONFIG.APPS_SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`Server returned ${res.status} ${res.statusText}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Apps Script error');

        resolve({
          fileId: data.data.fileId,
          viewUrl: data.data.viewUrl || `https://lh3.googleusercontent.com/d/${data.data.fileId}`,
          thumbnailUrl: data.data.thumbnailUrl || data.data.viewUrl,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (e) => reject(new Error('Gagal membaca file gambar: ' + e));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a unique filename for a photo.
 */
export function generatePhotoFilename(prefix, id, mimeType = 'image/jpeg') {
  const ext = mimeType.split('/')[1] || 'jpg';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}_${id}_${timestamp}.${ext}`;
}

/**
 * Convert a base64 data URL to a File object.
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
