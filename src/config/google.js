/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GOOGLE CONFIGURATION
 * ─────────────────────────────────────────────────────────────────────────────
 * Values are loaded from environment variables.
 *
 * LOCAL DEV:  Edit .env.local (never committed to git)
 * VERCEL:     Set in Vercel Dashboard → Project → Settings → Environment Variables
 *
 *   VITE_GOOGLE_CLIENT_ID  → Google Cloud Console → APIs & Services → Credentials
 *   VITE_SPREADSHEET_ID    → From URL: docs.google.com/spreadsheets/d/ID/edit
 *   VITE_DRIVE_FOLDER_ID   → From URL: drive.google.com/drive/folders/ID
 * ─────────────────────────────────────────────────────────────────────────────
 */

const sanitizeConfigValue = (val) => {
  if (typeof val !== 'string') return '';
  return val
    .trim()                           // Remove leading/trailing spaces/newlines
    .replace(/^["']|["']$/g, '')      // Remove leading/trailing single/double quotes
    .trim();                          // Remove any extra spaces after quote removal
};

export const GOOGLE_CONFIG = {
  // ── OAuth Client ID ───────────────────────────────────────────────────────
  CLIENT_ID: sanitizeConfigValue(import.meta.env.VITE_GOOGLE_CLIENT_ID),

  // ── Google Sheets: Spreadsheet ID ─────────────────────────────────────────
  SPREADSHEET_ID: sanitizeConfigValue(import.meta.env.VITE_SPREADSHEET_ID),

  // ── Google Apps Script (Backend) URL ──────────────────────────────────────
  APPS_SCRIPT_URL: sanitizeConfigValue(import.meta.env.VITE_APPS_SCRIPT_URL),

  // ── Google Drive: Photo Folder ID ─────────────────────────────────────────
  DRIVE_FOLDER_ID: sanitizeConfigValue(import.meta.env.VITE_DRIVE_FOLDER_ID),

  // ── OAuth Scopes ──────────────────────────────────────────────────────────
  SCOPES: [
    'openid',
    'email',
    'profile'
  ].join(' '),

  // ── Sheet tab names (must match your Google Spreadsheet tab names) ────────
  SHEETS: {
    AUDITS: 'Audits',
    RED_TAGS: 'RedTags',
    ACTION_ITEMS: 'ActionItems',
    SCHEDULES: 'Schedules',
    USERS_APPROVED: 'Users_Approved',
    USERS_PENDING: 'Users_Pending',
    ZONES: 'Zones',
    DEPARTMENTS: 'Departments',
  },
};

/** Check if Google config has been filled in */
export const isGoogleConfigured = () =>
  !!GOOGLE_CONFIG.CLIENT_ID &&
  !!GOOGLE_CONFIG.SPREADSHEET_ID &&
  !!GOOGLE_CONFIG.APPS_SCRIPT_URL;

