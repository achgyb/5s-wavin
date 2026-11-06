/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GOOGLE SHEETS SERVICE
 * All CRUD operations for the 5S Factory Audit database stored in Google Sheets.
 *
 * Each tab uses a header row (row 1). Data starts at row 2.
 * Row order: newest records are appended at the bottom.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { GOOGLE_CONFIG } from '../config/google';
const URL = () => GOOGLE_CONFIG.APPS_SCRIPT_URL;

/** ── Helper: Send POST request to GAS Backend ───────────────────────────── */
async function fetchGAS(payload) {
  if (!URL()) throw new Error('APPS_SCRIPT_URL is not configured.');
  
  const res = await fetch(URL(), {
    method: 'POST',
    // Do NOT set Content-Type to application/json for GAS web apps to avoid preflight issues 
    // when simple requests are preferred, though our GAS handles OPTIONS anyway.
    body: JSON.stringify(payload),
  });
  
  if (!res.ok) throw new Error(`Backend error: ${res.statusText}`);
  const data = await res.json();
  if (!data.success) throw new Error(`GAS Error: ${data.error}`);
  return data.data;
}

/** ── Generic: Read all rows from a sheet tab ──────────────────────────────
 * Returns array of objects using header row as keys.
 */
export async function readSheet(sheetName) {
  return await fetchGAS({ action: 'read', sheetName });
}

/** ── Generic: Append one row to a sheet tab ─────────────────────────────── */
export async function appendRow(sheetName, rowObject) {
  return await fetchGAS({ action: 'append', sheetName, data: rowObject });
}

/** ── Generic: Update a single row by finding a matching ID column ────────── */
export async function updateRowById(sheetName, idColumnName, id, updatedFields) {
  return await fetchGAS({ action: 'update', sheetName, idColumnName, id, updatedFields });
}

/** ── Generic: Delete a row by ID ───────────────────────────────────────── */
export async function deleteRowById(sheetName, idColumnName, id) {
  return await fetchGAS({ action: 'delete', sheetName, idColumnName, id });
}

/** ── Initialize sheet with header row if it's empty ──────────────────────── */
export async function ensureHeaders(sheetName, headers) {
  return await fetchGAS({ action: 'ensureHeaders', sheetName, headers });
}

// ─── Domain-specific helpers ─────────────────────────────────────────────────

const S = GOOGLE_CONFIG.SHEETS;

export const sheetsDB = {
  // ── Audits ────────────────────────────────────────────────────────────────
  audits: {
    headers: ['id', 'date', 'auditor', 'role', 'zone', 'score', 'answers', 'notes'],
    getAll: () => readSheet(S.AUDITS),
    add: (audit) => appendRow(S.AUDITS, {
      ...audit,
      answers: JSON.stringify(audit.answers || {}),
    }),
  },

  // ── Red Tags ──────────────────────────────────────────────────────────────
  redTags: {
    headers: ['id', 'description', 'reason', 'disposition', 'owner', 'timestamp', 'status', 'location', 'photoUrl', 'photoId'],
    getAll: () => readSheet(S.RED_TAGS),
    add: (tag) => appendRow(S.RED_TAGS, tag),
    updateStatus: (id, status) => updateRowById(S.RED_TAGS, 'id', id, { status }),
    resolve: (id) => updateRowById(S.RED_TAGS, 'id', id, { status: 'Resolved' }),
  },

  // ─── Action Items / Findings ──────────────────────────────────────────────
  actionItems: {
    headers: ['id', 'auditId', 'pillar', 'title', 'severity', 'location', 'assignedTo', 'dueDate', 'status', 'photoUrl'],
    getAll: () => readSheet(S.ACTION_ITEMS),
    add: (item) => appendRow(S.ACTION_ITEMS, item),
    updateStatus: (id, status) => updateRowById(S.ACTION_ITEMS, 'id', id, { status }),
  },

  // ── Schedules ─────────────────────────────────────────────────────────────
  schedules: {
    headers: ['id', 'zone', 'auditor', 'date', 'status'],
    getAll: () => readSheet(S.SCHEDULES),
    add: (schedule) => appendRow(S.SCHEDULES, schedule),
    updateStatus: (id, status) => updateRowById(S.SCHEDULES, 'id', id, { status }),
  },

  // ── Approved Users ────────────────────────────────────────────────────────
  usersApproved: {
    headers: ['id', 'name', 'email', 'role', 'authType', 'pin', 'googleId', 'avatar', 'avatarColor', 'companyEmail', 'department', 'approvedAt'],
    getAll: () => readSheet(S.USERS_APPROVED),
    add: (user) => appendRow(S.USERS_APPROVED, user),
    update: (id, fields) => updateRowById(S.USERS_APPROVED, 'id', id, fields),
    delete: (id) => deleteRowById(S.USERS_APPROVED, 'id', id),
  },

  // ── Pending Users ─────────────────────────────────────────────────────────
  usersPending: {
    headers: ['id', 'name', 'email', 'avatar', 'avatarColor', 'googleId', 'requestedAt', 'status'],
    getAll: () => readSheet(S.USERS_PENDING),
    add: (user) => appendRow(S.USERS_PENDING, user),
    updateStatus: (id, status) => updateRowById(S.USERS_PENDING, 'id', id, { status }),
    delete: (id) => deleteRowById(S.USERS_PENDING, 'id', id),
  },

  // ── Zones ─────────────────────────────────────────────────────────────────
  zones: {
    headers: ['id', 'name', 'description', 'score', 'department'],
    getAll: () => readSheet(S.ZONES),
    add: (zone) => appendRow(S.ZONES, zone),
    delete: (id) => deleteRowById(S.ZONES, 'id', id),
  },

  // ── Departments ───────────────────────────────────────────────────────────
  departments: {
    headers: ['id', 'name'],
    getAll: () => readSheet(S.DEPARTMENTS),
    add: (dept) => appendRow(S.DEPARTMENTS, dept),
    delete: (id) => deleteRowById(S.DEPARTMENTS, 'id', id),
  },

  /** Initialize all sheet headers on first run */
  async initializeAllHeaders() {
    await Promise.all([
      ensureHeaders(S.AUDITS, this.audits.headers),
      ensureHeaders(S.RED_TAGS, this.redTags.headers),
      ensureHeaders(S.ACTION_ITEMS, this.actionItems.headers),
      ensureHeaders(S.SCHEDULES, this.schedules.headers),
      ensureHeaders(S.USERS_APPROVED, this.usersApproved.headers),
      ensureHeaders(S.USERS_PENDING, this.usersPending.headers),
      ensureHeaders(S.ZONES, this.zones.headers),
      ensureHeaders(S.DEPARTMENTS, this.departments.headers),
    ]);
  },
};
