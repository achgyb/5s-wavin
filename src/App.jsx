import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import Checklist from './components/Checklist';
import RedTag from './components/RedTag';
import RedTagRegistry from './components/RedTagRegistry';
import Dashboard from './components/Dashboard';
import SafetyDashboard from './components/SafetyDashboard';
import ActionTracker from './components/ActionTracker';
import Schedule from './components/Schedule';
import AdminPanel from './components/AdminPanel';
import CompanyEmailModal from './components/CompanyEmailModal';
import { initGoogleAuth, isSignedIn, signInWithGoogle, getValidToken } from './services/googleAuth';
import { sheetsDB, readSheet } from './services/googleSheets';
import { isGoogleConfigured, GOOGLE_CONFIG } from './config/google';

const DEFAULT_ZONES = [
  { id: 'zone-1', name: 'PLANT 04 - ZONE B', description: 'CNC Workshop Section B', score: 92, department: 'PRODUCTION' },
  { id: 'zone-2', name: 'PLANT 04 - ZONE A', description: 'Logistics & Loading Dock', score: 94, department: 'LOGISTICS' },
  { id: 'zone-3', name: 'PLANT 02 - LINE 1', description: 'Assembly Line 01', score: 79, department: 'PRODUCTION' },
  { id: 'zone-4', name: 'WAREHOUSE - RECEIVING', description: 'Warehouse Incoming Shipments', score: 91, department: 'LOGISTICS' },
  { id: 'zone-5', name: 'PAINT WORKSHOP', description: 'Painting and Coating Line', score: 84, department: 'PRODUCTION' },
  { id: 'zone-6', name: 'QC-2 INSPECTION', description: 'Quality Control Station 2', score: 98, department: 'QUALITY CONTROL' },
  { id: 'zone-7', name: 'ASSEMBLY 4', description: 'Main Assembly Conveyor 4', score: 74, department: 'PRODUCTION' },
  { id: 'zone-8', name: 'MACHINING BLOCK', description: 'Engine Block Machining Line', score: 81, department: 'PRODUCTION' },
  { id: 'zone-9', name: 'WELDING CELL', description: 'Robotic Welding Enclosures', score: 95, department: 'PRODUCTION' },
  { id: 'zone-10', name: 'REWORK STATION', description: 'Post-Inspection Rework Area', score: 69, department: 'MAINTENANCE' }
];

const DEFAULT_DEPARTMENTS = [
  { id: 'dept-1', name: 'PRODUCTION' },
  { id: 'dept-2', name: 'MAINTENANCE' },
  { id: 'dept-3', name: 'QUALITY CONTROL' },
  { id: 'dept-4', name: 'LOGISTICS' },
  { id: 'dept-5', name: 'EHS (HEALTH & SAFETY)' }
];

// Helper to load localStorage data or fall back to mock data
const getInitialState = (key, fallback) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : fallback;
};

// Initial Mock Data
const MOCK_AUDITS = [
  { id: 'aud-1', date: '2026-06-25', auditor: 'J. MILLER', role: 'OPERATOR', zone: 'PLANT 04 - ZONE B', score: 92, answers: {} },
  { id: 'aud-2', date: '2026-06-28', auditor: 'S. CHEN', role: 'MANAGER', zone: 'PLANT 04 - ZONE A', score: 88, answers: {} },
  { id: 'aud-3', date: '2026-07-01', auditor: 'J. MILLER', role: 'OPERATOR', zone: 'PLANT 02 - LINE 1', score: 79, answers: {} }
];

const MOCK_RED_TAGS = [
  { id: 'RT-40922', description: 'Damaged pallet in main aisle way blocking traffic', reason: 'misplaced', disposition: 'discard', owner: 'J. MILLER', timestamp: '2026-07-01 | 09:42 AM', status: 'Active', location: 'PLANT 04 - SECTION B - LINE 2', photo: 'captured_tag_item.jpg' },
  { id: 'RT-11902', description: 'Unlabeled metal scrap bin near welding area', reason: 'unused', disposition: 'relocate', owner: 'S. CHEN', timestamp: '2026-07-01 | 11:15 AM', status: 'Active', location: 'PLANT 04 - SECTION B - LINE 2', photo: null }
];

const MOCK_ACTION_ITEMS = [
  { id: 'AC-10292', title: 'Hydraulic oil leak detected on Press 04 Main Cylinder. Hazard risk high.', severity: 'CRITICAL', location: 'ZONE B - FABRICATION', assignedTo: 'J. CHEN', dueDate: '2026-07-12', status: 'TO DO', photo: true },
  { id: 'AC-10293', title: 'Damaged floor marking at Forklift Crossing 02.', severity: 'MEDIUM', location: 'ZONE A - LOGISTICS', assignedTo: 'A. SMITH', dueDate: '2026-07-15', status: 'TO DO', photo: false },
  { id: 'AC-10294', title: 'Shadow board tool missing at Station 04. Re-ordering metric set.', severity: 'PRIORITY', location: 'ZONE C - ASSEMBLY', assignedTo: 'R. VANCE', dueDate: '2026-07-14', status: 'IN PROGRESS', photo: true },
  { id: 'AC-10295', title: 'Clean up spilled coolant near CNC-12.', severity: 'MEDIUM', location: 'ZONE B - MACHINING', assignedTo: 'M. HOFFMAN', dueDate: '2026-06-30', status: 'DONE', photo: false }
];

const MOCK_SCHEDULES = [
  { id: 'SCH-1002', zone: 'PLANT 04 - ZONE B', auditor: 'J. MILLER', date: '2026-07-02', status: 'PLANNED' },
  { id: 'SCH-1003', zone: 'PLANT 02 - LINE 1', auditor: 'S. CHEN', date: '2026-07-03', status: 'PLANNED' },
  { id: 'SCH-1004', zone: 'PLANT 04 - ZONE A', auditor: 'J. MILLER', date: '2026-06-28', status: 'COMPLETED' },
  { id: 'SCH-1005', zone: 'PLANT 04 - ZONE B', auditor: 'S. CHEN', date: '2026-07-01', status: 'OVERDUE' }
];

// Pre-seeded approved users (built-in legacy PIN accounts + pre-approved Google manager accounts)
const DEFAULT_APPROVED_USERS = [
  {
    id: 'user-google-dicky',
    name: 'DICKY SETYAWAN',
    email: 'dicky.setyawan@gmail.com',
    role: 'MANAGER',
    authType: 'GOOGLE',
    approvedAt: '2026-01-01',
    avatar: 'DS',
    avatarColor: '#1a73e8',
    companyEmail: 'dicky.setyawan@gmail.com',
    department: 'PRODUCTION'
  },
  {
    id: 'user-google-admin',
    name: 'ADMIN FACTORY',
    email: 'admin.factory@gmail.com',
    role: 'MANAGER',
    authType: 'GOOGLE',
    approvedAt: '2026-01-01',
    avatar: 'AF',
    avatarColor: '#34a853',
    companyEmail: 'admin.factory@gmail.com',
    department: 'PRODUCTION'
  },
  {
    id: 'user-pin-operator',
    name: 'J. MILLER',
    email: null,
    role: 'OPERATOR',
    authType: 'PIN',
    pin: '1111',
    approvedAt: '2026-01-01',
    avatar: 'JM',
    avatarColor: '#E8472A',
  },
  {
    id: 'user-pin-manager',
    name: 'S. CHEN',
    email: null,
    role: 'MANAGER',
    authType: 'PIN',
    pin: '310794',
    approvedAt: '2026-01-01',
    avatar: 'SC',
    avatarColor: '#E8472A',
  },
];

function App() {
  const [currentUser, setCurrentUser] = useState(() => getInitialState('5s_currentUser', null));
  const [currentView, setCurrentView] = useState(() => getInitialState('5s_currentView', 'LOGIN'));
  
  const [audits, setAudits] = useState(() => getInitialState('5s_audits', MOCK_AUDITS));
  const [redTags, setRedTags] = useState(() => getInitialState('5s_redTags', MOCK_RED_TAGS));
  const [actionItems, setActionItems] = useState(() => getInitialState('5s_actionItems', MOCK_ACTION_ITEMS));
  const [schedules, setSchedules] = useState(() => getInitialState('5s_schedules', MOCK_SCHEDULES));
  const [zones, setZones] = useState(() => getInitialState('5s_zones', DEFAULT_ZONES));
  const [departments, setDepartments] = useState(() => getInitialState('5s_departments', DEFAULT_DEPARTMENTS));


  // ─── Google Services Init ────────────────────────────────────────────────
  const [googleReady, setGoogleReady] = useState(false);
  const [googleTokenActive, setGoogleTokenActive] = useState(false);

  // Auto-update default PINs in case user has old ones cached in localStorage
  useEffect(() => {
    setApprovedUsers(prev => prev.map(user => {
      const defaultMatch = DEFAULT_APPROVED_USERS.find(d => d.id === user.id);
      if (defaultMatch && user.pin !== defaultMatch.pin) {
        return { ...user, pin: defaultMatch.pin };
      }
      return user;
    }));
  }, []);

  useEffect(() => {
    if (isGoogleConfigured()) {
      initGoogleAuth()
        .then(() => {
          setGoogleReady(true);
          // Set initial token active state if already signed in
          setGoogleTokenActive(isSignedIn());
        })
        .catch(err => console.warn('Google Auth init failed (configure src/config/google.js):', err));
    }
  }, []);

  // Sync token state on login / view changes
  useEffect(() => {
    if (googleReady) {
      setGoogleTokenActive(isSignedIn());
    }
  }, [googleReady, currentUser, currentView]);

  // Fetch all data from Google Sheets when a valid Google token is active
  useEffect(() => {
    if (googleReady && googleTokenActive) {
      const loadSheetsDatabase = async () => {
        try {
          // 1. Initialize headers on empty tabs
          await sheetsDB.initializeAllHeaders();

          // 2. Fetch all databases in parallel
          const [
            sheetAudits,
            sheetRedTags,
            sheetActions,
            sheetSchedules,
            sheetZones,
            sheetDepts,
            sheetApproved,
            sheetPending
          ] = await Promise.all([
            sheetsDB.audits.getAll(),
            sheetsDB.redTags.getAll(),
            sheetsDB.actionItems.getAll(),
            sheetsDB.schedules.getAll(),
            sheetsDB.zones.getAll(),
            sheetsDB.departments.getAll(),
            sheetsDB.usersApproved.getAll(),
            sheetsDB.usersPending.getAll()
          ]);

          // 3. Populate state if sheets contain data
          if (sheetAudits.length > 0) setAudits(sheetAudits);
          
          if (sheetRedTags.length > 0) {
            setRedTags(sheetRedTags.map(tag => ({
              ...tag,
              // convert status to proper case
              status: tag.status || 'Active'
            })));
          }
          
          if (sheetActions.length > 0) setActionItems(sheetActions);
          if (sheetSchedules.length > 0) setSchedules(sheetSchedules);
          
          if (sheetZones.length > 0) {
            setZones(sheetZones.map(z => ({
              ...z,
              score: parseInt(z.score || '0', 10)
            })));
          }
          
          if (sheetDepts.length > 0) setDepartments(sheetDepts);
          if (sheetApproved.length > 0) setApprovedUsers(sheetApproved);
          if (sheetPending.length > 0) setPendingUsers(sheetPending);

          console.log('Successfully synced database with Google Sheets.');
        } catch (err) {
          console.error('Failed to load Google Sheets database:', err);
        }
      };
      loadSheetsDatabase();
    }
  }, [googleReady, googleTokenActive]);

  // ─── Access Control State ───────────────────────────────────────────────────
  const [pendingUsers, setPendingUsers] = useState(() =>
    getInitialState('5s_pendingUsers', [])
  );
  const [approvedUsers, setApprovedUsers] = useState(() =>
    getInitialState('5s_approvedUsers', DEFAULT_APPROVED_USERS)
  );

  // ─── Company Email collection (shown once after Google approval) ────────────
  const [showCompanyEmailModal, setShowCompanyEmailModal] = useState(false);
  const [pendingLoginUser, setPendingLoginUser] = useState(null); // approvedUser waiting for email

  // Sync to local storage
  useEffect(() => { localStorage.setItem('5s_currentUser', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('5s_currentView', JSON.stringify(currentView)); }, [currentView]);
  useEffect(() => { localStorage.setItem('5s_audits', JSON.stringify(audits)); }, [audits]);
  useEffect(() => { localStorage.setItem('5s_redTags', JSON.stringify(redTags)); }, [redTags]);
  useEffect(() => { localStorage.setItem('5s_actionItems', JSON.stringify(actionItems)); }, [actionItems]);
  useEffect(() => { localStorage.setItem('5s_schedules', JSON.stringify(schedules)); }, [schedules]);
  useEffect(() => { localStorage.setItem('5s_zones', JSON.stringify(zones)); }, [zones]);
  useEffect(() => { localStorage.setItem('5s_departments', JSON.stringify(departments)); }, [departments]);
  useEffect(() => { localStorage.setItem('5s_pendingUsers', JSON.stringify(pendingUsers)); }, [pendingUsers]);
  useEffect(() => { localStorage.setItem('5s_approvedUsers', JSON.stringify(approvedUsers)); }, [approvedUsers]);

  // Migration effect to patch older localStorage zones with default departments
  useEffect(() => {
    let updated = false;
    const patchedZones = zones.map((z) => {
      if (!z.department) {
        updated = true;
        // Match default department mapping
        if (z.name.includes('ZONE B') || z.name.includes('LINE 1') || z.name.includes('ASSEMBLY') || z.name.includes('MACHINING') || z.name.includes('WELDING')) {
          return { ...z, department: 'PRODUCTION' };
        } else if (z.name.includes('ZONE A') || z.name.includes('RECEIVING')) {
          return { ...z, department: 'LOGISTICS' };
        } else if (z.name.includes('QC-2') || z.name.includes('INSPECTION')) {
          return { ...z, department: 'QUALITY CONTROL' };
        } else if (z.name.includes('REWORK') || z.name.includes('PAINT')) {
          return { ...z, department: 'MAINTENANCE' };
        }
        return { ...z, department: 'PRODUCTION' };
      }
      return z;
    });
    if (updated) {
      setZones(patchedZones);
    }
  }, [zones]);

  const handleCreateZone = async (newZone) => {
    setZones(prev => [...prev, newZone]);
    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.zones.add(newZone);
      } catch (err) {
        console.error('Failed to create zone in Sheets:', err);
      }
    }
  };

  const handleDeleteZone = async (zoneId) => {
    setZones(prev => prev.filter(z => z.id !== zoneId));
    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.zones.delete(zoneId);
      } catch (err) {
        console.error('Failed to delete zone from Sheets:', err);
      }
    }
  };

  const handleCreateDepartment = async (newDept) => {
    setDepartments(prev => [...prev, newDept]);
    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.departments.add(newDept);
      } catch (err) {
        console.error('Failed to create department in Sheets:', err);
      }
    }
  };

  const handleDeleteDepartment = async (deptId) => {
    setDepartments(prev => prev.filter(d => d.id !== deptId));
    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.departments.delete(deptId);
      } catch (err) {
        console.error('Failed to delete department from Sheets:', err);
      }
    }
  };

  // ─── Access Control Handlers ────────────────────────────────────────────────

  /**
   * Called when user clicks "Sign in with Google" and picks an account.
   * Returns status: 'approved' | 'pending' | 'rejected' | 'registered'
   */
  const handleGoogleSignUp = async (googleUserData) => {
    const email = googleUserData.email.toLowerCase();

    // ── First, try to refresh from Sheets so we have the latest state ──────
    // (At this point the operator just completed Google OAuth so a token is active)
    if (isGoogleConfigured()) {
      try {
        const [sheetApproved, sheetPending] = await Promise.all([
          sheetsDB.usersApproved.getAll(),
          sheetsDB.usersPending.getAll()
        ]);
        if (sheetApproved.length > 0) setApprovedUsers(sheetApproved);
        if (sheetPending.length > 0) setPendingUsers(sheetPending);

        // Re-check against freshly-fetched data
        const freshApproved = sheetApproved.length > 0 ? sheetApproved : approvedUsers;
        const freshPending  = sheetPending.length  > 0 ? sheetPending  : pendingUsers;

        const existingApprovedFresh = freshApproved.find(
          (u) => u.email && u.email.toLowerCase() === email
        );
        if (existingApprovedFresh) {
          return { status: 'approved', user: existingApprovedFresh };
        }

        const existingPendingFresh = freshPending.find(
          (u) => u.email && u.email.toLowerCase() === email
        );
        if (existingPendingFresh) {
          if (existingPendingFresh.status === 'REJECTED') {
            return { status: 'rejected', user: existingPendingFresh };
          }
          return { status: 'pending', user: existingPendingFresh };
        }
      } catch (err) {
        console.warn('Could not refresh from Sheets during sign-up, using local state:', err);
      }
    }

    // Check if already approved (local fallback)
    const existingApproved = approvedUsers.find(
      (u) => u.email && u.email.toLowerCase() === email
    );
    if (existingApproved) {
      return { status: 'approved', user: existingApproved };
    }

    // Check if already pending (local fallback)
    const existingPending = pendingUsers.find(
      (u) => u.email && u.email.toLowerCase() === email
    );
    if (existingPending) {
      if (existingPending.status === 'REJECTED') {
        return { status: 'rejected', user: existingPending };
      }
      return { status: 'pending', user: existingPending };
    }

    // Create new pending request
    const newPending = {
      id: `pending-${Date.now()}`,
      name: googleUserData.name,
      email,
      avatar: googleUserData.avatar,
      avatarColor: googleUserData.avatarColor,
      googleId: googleUserData.googleId,
      requestedAt: new Date().toISOString(),
      status: 'PENDING',
    };
    
    setPendingUsers((prev) => [newPending, ...prev]);

    // Save to Google Sheets — token is active right now (operator just signed in with Google)
    if (isGoogleConfigured()) {
      sheetsDB.usersPending.add(newPending).catch(err => {
        console.error('Failed to save pending user to Sheets:', err);
        alert('ERROR SAVING TO GOOGLE SHEETS: ' + err.message + '\n\nPlease tell the manager to make sure the Spreadsheet is shared as "Anyone with the link can EDIT".');
      });
    } else {
      alert('WARNING: Google Sheets is not fully configured (missing Spreadsheet ID or Drive ID in Vercel). Saving to local storage only.');
    }

    return { status: 'registered', user: newPending };
  };

  /** Approve a pending user. Assigns role chosen by admin/manager. */
  const handleApproveUser = async (pendingId, role) => {
    const pendingUser = pendingUsers.find((u) => u.id === pendingId);
    if (!pendingUser) return;

    const approvedUser = {
      id: `user-google-${Date.now()}`,
      name: pendingUser.name,
      email: pendingUser.email,
      role,
      authType: 'GOOGLE',
      googleId: pendingUser.googleId,
      avatar: pendingUser.avatar,
      avatarColor: pendingUser.avatarColor,
      approvedAt: new Date().toISOString(),
      companyEmail: '',
      department: ''
    };
    
    setApprovedUsers((prev) => [approvedUser, ...prev]);
    setPendingUsers((prev) => prev.filter((u) => u.id !== pendingId));

    if (googleReady && isGoogleConfigured()) {
      try {
        await Promise.all([
          sheetsDB.usersApproved.add(approvedUser),
          sheetsDB.usersPending.delete(pendingId)
        ]);
      } catch (err) {
        console.error('Failed to update user approval in Sheets:', err);
      }
    }
  };

  /** Reject a pending user (keeps them in the list as REJECTED). */
  const handleRejectUser = async (pendingId) => {
    setPendingUsers((prev) =>
      prev.map((u) => (u.id === pendingId ? { ...u, status: 'REJECTED' } : u))
    );

    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.usersPending.updateStatus(pendingId, 'REJECTED');
      } catch (err) {
        console.error('Failed to reject user in Sheets:', err);
      }
    }
  };

  /** Remove a rejected/pending user entirely from the list. */
  const handleRemovePendingUser = async (pendingId) => {
    setPendingUsers((prev) => prev.filter((u) => u.id !== pendingId));

    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.usersPending.delete(pendingId);
      } catch (err) {
        console.error('Failed to remove pending user from Sheets:', err);
      }
    }
  };

  /**
   * Refresh pending users from Google Sheets (cross-device sync).
   * Called manually by the manager via the "Refresh" button in AdminPanel,
   * and automatically when the ADMIN view is opened.
   */
  const handleRefreshPendingUsers = async () => {
    if (!isGoogleConfigured()) return;
    try {
      const [sheetApproved, sheetPending] = await Promise.all([
        sheetsDB.usersApproved.getAll(),
        sheetsDB.usersPending.getAll()
      ]);
      if (sheetApproved.length > 0) setApprovedUsers(sheetApproved);
      // Always update pending (even empty means all were processed)
      setPendingUsers(sheetPending);
      return true;
    } catch (err) {
      console.error('Failed to refresh pending users from Sheets:', err);
      return false;
    }
  };

  /** Revoke an approved Google user. */
  const handleRevokeUser = async (userId) => {
    setApprovedUsers((prev) => prev.filter((u) => u.id !== userId));

    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.usersApproved.delete(userId);
      } catch (err) {
        console.error('Failed to revoke approved user from Sheets:', err);
      }
    }
  };

  // ─── View Routing ────────────────────────────────────────────────────────────

  const handleLogin = (user) => {
    setCurrentUser(user);
    if (user.role === 'MANAGER') {
      setCurrentView('DASHBOARD');
    } else {
      setCurrentView('CHECKLIST');
    }
  };

  const handleGoogleLogin = (approvedUser) => {
    // If this Google user doesn't yet have a company email or department, collect it first
    if (!approvedUser.companyEmail || !approvedUser.department) {
      setPendingLoginUser(approvedUser);
      setShowCompanyEmailModal(true);
      return;
    }
    // Already has a company email & department — go straight in
    _enterApp(approvedUser);
  };

  /** Save company email and department to approvedUsers record, then enter the app. */
  const handleCompanyEmailSubmit = async (companyEmail, department) => {
    const updatedUser = { ...pendingLoginUser, companyEmail, department };
    // Persist to approvedUsers so future logins remember it locally
    setApprovedUsers((prev) =>
      prev.map((u) => (u.id === pendingLoginUser.id ? updatedUser : u))
    );

    // Persist to Google Sheets so the database remembers it across sessions
    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.usersApproved.update(pendingLoginUser.id, { companyEmail, department });
      } catch (err) {
        console.error('Failed to save company profile to Sheets:', err);
      }
    }

    setShowCompanyEmailModal(false);
    setPendingLoginUser(null);
    _enterApp(updatedUser);
  };

  /** Internal: set currentUser and route to the correct view. */
  const _enterApp = (approvedUser) => {
    setCurrentUser({
      id: approvedUser.id,
      name: approvedUser.name,
      email: approvedUser.email,
      companyEmail: approvedUser.companyEmail || null,
      department: approvedUser.department || null,
      role: approvedUser.role,
      authType: 'GOOGLE',
      avatar: approvedUser.avatar,
      avatarColor: approvedUser.avatarColor,
    });
    if (approvedUser.role === 'MANAGER') {
      setCurrentView('DASHBOARD');
    } else {
      setCurrentView('CHECKLIST');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('LOGIN');
  };

  // ─── Audit / Data Handlers ───────────────────────────────────────────────────

  // ─── Audit / Data Handlers ───────────────────────────────────────────────────

  const handleSubmitAudit = async (auditData, newFindings = []) => {
    const newAudit = { ...auditData, id: `aud-${Date.now()}` };
    setAudits(prev => [newAudit, ...prev]);

    // Save to Google Sheets if ready
    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.audits.add({
          id: newAudit.id,
          date: newAudit.date,
          auditor: newAudit.auditor,
          role: newAudit.role,
          zone: newAudit.zone,
          score: newAudit.score,
          answers: JSON.stringify(newAudit.answers),
          notes: JSON.stringify(newAudit.failedItems.map(f => ({ qId: f.qId, notes: f.notes })))
        });
      } catch (err) {
        console.error('Failed to save audit to Sheets:', err);
      }
    }

    if (newFindings.length > 0) {
      // 1. Process Findings (Action Items)
      const findingsWithAuditId = newFindings.map(f => ({ ...f, auditId: newAudit.id }));
      setActionItems(prev => [...findingsWithAuditId, ...prev]);

      if (googleReady && isGoogleConfigured()) {
        findingsWithAuditId.forEach(async (finding) => {
          try {
            await sheetsDB.actionItems.add(finding);
          } catch (err) {
            console.error('Failed to save finding to Sheets:', err);
          }
        });
      }

      // 2. Also generate Red Tags if the finding was for the SORT category
      auditData.failedItems.forEach(async (failed) => {
        if (failed.category === 'SORT') {
          const redTagId = `RT-${Math.floor(10000 + Math.random() * 90000)}`;
          const firstPhotoUrl = failed.photos?.[0]?.url || '';
          const newRedTag = {
            id: redTagId,
            description: `Audit sorting failure: ${failed.questionText}. Details: ${failed.notes}`,
            reason: 'misplaced',
            disposition: 'needs_review',
            owner: auditData.auditor,
            timestamp: `${new Date().toISOString().split('T')[0]} | ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            photoUrl: firstPhotoUrl,
            photoId: failed.photos?.[0]?.id || '',
            status: 'Active',
            location: auditData.zone
          };
          setRedTags(prev => [newRedTag, ...prev]);

          if (googleReady && isGoogleConfigured()) {
            try {
              await sheetsDB.redTags.add(newRedTag);
            } catch (err) {
              console.error('Failed to save red tag to Sheets:', err);
            }
          }
        }
      });
    }

    setSchedules(prev =>
      prev.map(s => {
        const isMatched = s.zone.toUpperCase().includes(auditData.zone.toUpperCase()) && s.status !== 'COMPLETED';
        if (isMatched) {
          const updated = { ...s, status: 'COMPLETED' };
          if (googleReady && isGoogleConfigured()) {
            sheetsDB.schedules.updateStatus(s.id, 'COMPLETED').catch(err =>
              console.error('Failed to update schedule status in Sheets:', err)
            );
          }
          return updated;
        }
        return s;
      })
    );

    if (currentUser.role === 'MANAGER') {
      setCurrentView('DASHBOARD');
    }
  };

  const handleSubmitRedTag = async (redTagData) => {
    setRedTags(prev => [redTagData, ...prev]);

    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.redTags.add(redTagData);
      } catch (err) {
        console.error('Failed to save red tag to Sheets:', err);
      }
    }

    const actionId = `AC-${Math.floor(10000 + Math.random() * 90000)}`;
    const newAction = {
      id: actionId,
      title: `Red-Tag Disposition: ${redTagData.description} (Proposed: ${redTagData.disposition})`,
      severity: 'PRIORITY',
      location: redTagData.location,
      assignedTo: redTagData.owner,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'TO DO',
      photoUrl: redTagData.photoUrl || ''
    };
    setActionItems(prev => [newAction, ...prev]);

    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.actionItems.add(newAction);
      } catch (err) {
        console.error('Failed to save action item to Sheets:', err);
      }
    }

    if (currentUser.role === 'MANAGER') {
      setCurrentView('DASHBOARD');
    } else {
      setCurrentView('CHECKLIST');
    }
  };

  const handleUpdateActionStatus = async (itemId, nextStatus) => {
    setActionItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, status: nextStatus };
          if (nextStatus === 'DONE') {
            setRedTags(prevTags =>
              prevTags.map(tag => {
                const isMatch = item.title.includes(tag.id) || tag.description.includes(item.title.split(' ')[0]);
                if (isMatch) {
                  const resolvedTag = { ...tag, status: 'Resolved' };
                  if (googleReady && isGoogleConfigured()) {
                    sheetsDB.redTags.resolve(tag.id).catch(err =>
                      console.error('Failed to resolve red tag in Sheets:', err)
                    );
                  }
                  return resolvedTag;
                }
                return tag;
              })
            );
          }
          return updatedItem;
        }
        return item;
      })
    );

    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.actionItems.updateStatus(itemId, nextStatus);
      } catch (err) {
        console.error('Failed to update action status in Sheets:', err);
      }
    }
  };

  const handleCreateActionItem = async (item) => {
    setActionItems(prev => [item, ...prev]);
    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.actionItems.add(item);
      } catch (err) {
        console.error('Failed to save custom action item to Sheets:', err);
      }
    }
  };

  const handleCreateSchedule = async (scheduleItem) => {
    setSchedules(prev => [scheduleItem, ...prev]);
    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.schedules.add(scheduleItem);
      } catch (err) {
        console.error('Failed to save schedule to Sheets:', err);
      }
    }
  };

  const handleHeatmapNewAudit = () => { setCurrentView('CHECKLIST'); };

  const handleConnectGoogle = async () => {
    try {
      await initGoogleAuth();
      await signInWithGoogle();
      setGoogleTokenActive(true);
      alert('Google Sheets database synced successfully!');
    } catch (err) {
      console.error('Google Sheets sync connection failed:', err);
      const clientConfigured = isGoogleConfigured();
      const hasTokenClient = typeof window !== 'undefined' && !!window.google?.accounts?.oauth2?.initTokenClient;
      alert(
        `Failed to connect: ${err.message}\n\n` +
        `Diagnostics:\n` +
        `- googleReady: ${googleReady}\n` +
        `- googleTokenActive: ${googleTokenActive}\n` +
        `- isGoogleConfigured(): ${clientConfigured}\n` +
        `- GIS library loaded: ${hasTokenClient}\n` +
        `- CLIENT_ID length: ${GOOGLE_CONFIG.CLIENT_ID?.length || 0}`
      );
    }
  };

  /** Resolve a red tag — updates local state + Google Sheets if configured */
  const handleResolveRedTag = async (tagId) => {
    setRedTags(prev =>
      prev.map(tag => tag.id === tagId ? { ...tag, status: 'Resolved' } : tag)
    );
    if (googleReady && isGoogleConfigured()) {
      try {
        await sheetsDB.redTags.resolve(tagId);
      } catch (err) {
        console.error('Failed to sync red-tag resolve to Sheets:', err);
      }
    }
  };

  const activePendingCount = pendingUsers.filter((u) => u.status === 'PENDING').length;

  // Auto-refresh pending users from Sheets whenever ADMIN view is opened and Google is configured
  useEffect(() => {
    if (currentView === 'ADMIN' && isGoogleConfigured()) {
      handleRefreshPendingUsers();
    }
  }, [currentView]);

  return (
    <>
    <Layout
      currentView={currentView}
      setCurrentView={setCurrentView}
      currentUser={currentUser}
      onLogout={handleLogout}
      pendingCount={activePendingCount}
      isGoogleSynced={googleReady && googleTokenActive}
      isGoogleConfigured={isGoogleConfigured()}
      onConnectGoogle={handleConnectGoogle}
    >
      {currentView === 'LOGIN' && (
        <Login
          onLogin={handleLogin}
          onGoogleSignUp={handleGoogleSignUp}
          onGoogleLogin={handleGoogleLogin}
          approvedUsers={approvedUsers}
        />
      )}

      {currentView === 'CHECKLIST' && (
        <Checklist currentUser={currentUser} onSubmitAudit={handleSubmitAudit} zones={zones} departments={departments} />
      )}

      {currentView === 'RED_TAG' && (
        <RedTag onSubmitRedTag={handleSubmitRedTag} />
      )}

      {currentView === 'RED_TAG_REGISTRY' && (
        <RedTagRegistry
          redTags={redTags}
          onResolveRedTag={handleResolveRedTag}
          onNewRedTag={() => setCurrentView('RED_TAG')}
        />
      )}

      {currentView === 'DASHBOARD' && (
        <Dashboard
          audits={audits}
          redTags={redTags}
          actionItems={actionItems}
          onNewAuditTrigger={handleHeatmapNewAudit}
          onSelectView={setCurrentView}
          zones={zones}
          pendingCount={activePendingCount}
        />
      )}

      {currentView === 'SAFETY_DASHBOARD' && (
        <SafetyDashboard />
      )}

      {currentView === 'ACTIONS' && (
        <ActionTracker
          actionItems={actionItems}
          onUpdateActionStatus={handleUpdateActionStatus}
          onCreateActionItem={handleCreateActionItem}
        />
      )}

      {currentView === 'SCHEDULE' && (
        <Schedule
          schedules={schedules}
          onCreateSchedule={handleCreateSchedule}
          onSelectView={setCurrentView}
          zones={zones}
        />
      )}

      {currentView === 'ADMIN' && (
        <AdminPanel
          zones={zones}
          onCreateZone={handleCreateZone}
          onDeleteZone={handleDeleteZone}
          departments={departments}
          onCreateDepartment={handleCreateDepartment}
          onDeleteDepartment={handleDeleteDepartment}
          pendingUsers={pendingUsers}
          approvedUsers={approvedUsers}
          onApproveUser={handleApproveUser}
          onRejectUser={handleRejectUser}
          onRemovePendingUser={handleRemovePendingUser}
          onRevokeUser={handleRevokeUser}
          onRefreshPendingUsers={handleRefreshPendingUsers}
          isGoogleConfigured={isGoogleConfigured()}
          currentUser={currentUser}
        />
      )}
    </Layout>

    {/* Company Email collection modal — shown once after first Google approval login */}
    {showCompanyEmailModal && pendingLoginUser && (
      <CompanyEmailModal
        user={pendingLoginUser}
        departments={departments}
        onSubmit={handleCompanyEmailSubmit}
      />
    )}
  </>
  );
}

export default App;
