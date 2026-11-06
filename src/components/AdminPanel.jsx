import React, { useState } from 'react';

const ROLE_OPTIONS = ['OPERATOR', 'MANAGER'];

export default function AdminPanel({
  zones,
  onCreateZone,
  onDeleteZone,
  departments = [],
  onCreateDepartment,
  onDeleteDepartment,
  pendingUsers = [],
  approvedUsers = [],
  onApproveUser,
  onRejectUser,
  onRemovePendingUser,
  onRevokeUser,
  onRefreshPendingUsers,
  isGoogleConfigured = false,
  currentUser,
}) {
  const [zoneName, setZoneName] = useState('');
  const [zoneDesc, setZoneDesc] = useState('');
  const [zoneDept, setZoneDept] = useState('');
  const [deptName, setDeptName] = useState('');
  const [approvalRoles, setApprovalRoles] = useState({});
  const [activeTab, setActiveTab] = useState('requests');
  const [confirmModal, setConfirmModal] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activePending = pendingUsers.filter((u) => u.status === 'PENDING');
  const rejectedPending = pendingUsers.filter((u) => u.status === 'REJECTED');

  const handleSubmitZone = (e) => {
    e.preventDefault();
    if (!zoneName.trim()) {
      alert('Please enter a zone name.');
      return;
    }
    const nameUpper = zoneName.trim().toUpperCase();
    if (zones.some((z) => z.name === nameUpper)) {
      alert('This zone name is already registered.');
      return;
    }
    onCreateZone({
      id: `zone-${Date.now()}`,
      name: nameUpper,
      description: zoneDesc.trim() || 'No description provided',
      department: zoneDept || (departments[0]?.name || 'PRODUCTION'),
    });
    setZoneName('');
    setZoneDesc('');
    setZoneDept('');
  };

  const handleSubmitDept = (e) => {
    e.preventDefault();
    if (!deptName.trim()) {
      alert('Please enter a department name.');
      return;
    }
    const nameUpper = deptName.trim().toUpperCase();
    if (departments.some((d) => d.name === nameUpper)) {
      alert('This department name is already registered.');
      return;
    }
    onCreateDepartment({
      id: `dept-${Date.now()}`,
      name: nameUpper,
    });
    setDeptName('');
  };

  const handleApprove = (pendingId) => {
    const role = approvalRoles[pendingId] || 'OPERATOR';
    onApproveUser(pendingId, role);
  };

  const handleRefresh = async () => {
    if (!onRefreshPendingUsers || isRefreshing) return;
    setIsRefreshing(true);
    await onRefreshPendingUsers();
    setIsRefreshing(false);
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs = [
    { id: 'requests', label: 'Access Requests', icon: 'person_add', badge: activePending.length },
    { id: 'users', label: 'Approved Users', icon: 'group', badge: 0 },
    { id: 'zones', label: 'Floor Zones', icon: 'location_on', badge: 0 },
    { id: 'departments', label: 'Departments', icon: 'corporate_fare', badge: 0 },
  ];

  const handleConfirmAction = () => {
    if (!confirmModal) return;
    if (confirmModal.type === 'revoke') {
      onRevokeUser(confirmModal.target.id);
    } else if (confirmModal.type === 'deleteZone') {
      onDeleteZone(confirmModal.target.id);
    } else if (confirmModal.type === 'deleteDept') {
      onDeleteDepartment(confirmModal.target.id);
    }
    setConfirmModal(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-32" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-bold text-[#353750] uppercase text-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-[#353750] text-2xl">admin_panel_settings</span>
          Admin Panel
        </h1>
        <p className="text-xs text-[#6B6E8A] mt-1">Manage access requests, approved users, floor zones, and departments</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-[#F4F4F6] border border-[#E0E0EC] rounded-xl mb-6 w-full overflow-x-auto whitespace-nowrap hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
              activeTab === tab.id
                ? 'bg-[#353750] text-white shadow-md'
                : 'text-[#6B6E8A] hover:text-[#353750] hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
            {tab.badge > 0 && (
              <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-[#F05731] text-white">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Access Requests ──────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div className="flex flex-col gap-6">
          {/* Pending Requests */}
          <div className="bg-white border border-[#E0E0EC] rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E0E0EC] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F05731] text-xl">hourglass_top</span>
                <h2 className="font-bold text-[#353750] uppercase text-sm tracking-wide">Pending Requests</h2>
              </div>
              <div className="flex items-center gap-2">
                {isGoogleConfigured && (
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E0E0EC] text-xs font-bold uppercase text-[#353750] hover:bg-[#F4F4F6] transition-all disabled:opacity-50"
                    title="Refresh from Google Sheets (pulls registrations from all devices)"
                  >
                    <span className={`material-symbols-outlined text-sm ${isRefreshing ? 'animate-spin' : ''}`}>
                      {isRefreshing ? 'autorenew' : 'sync'}
                    </span>
                    {isRefreshing ? 'Syncing...' : 'Refresh'}
                  </button>
                )}
                <span className="text-xs font-bold bg-[#FFF3E0] text-[#F05731] px-3 py-1 rounded-full border border-[#F05731]/20">
                  {activePending.length} Awaiting
                </span>
              </div>
            </div>

            {!isGoogleConfigured && (
              <div className="mx-4 mt-3 mb-0 px-3 py-2.5 bg-[#FFF9E6] border border-[#F5C518]/40 rounded-lg flex items-start gap-2">
                <span className="material-symbols-outlined text-[#E8920A] text-sm mt-0.5 shrink-0">info</span>
                <p className="text-[10px] text-[#8A6000] leading-relaxed">
                  <strong>Cross-device sync not active.</strong> Connect Google Sheets (Sync button in header) to see registration requests from other devices.
                </p>
              </div>
            )}

            {activePending.length === 0 ? (
              <div className="p-12 text-center text-[#6B6E8A] text-xs uppercase font-bold">
                <span className="material-symbols-outlined text-4xl block mb-2 opacity-30 text-[#353750]">check_circle</span>
                No pending access requests
              </div>
            ) : (
              <div className="divide-y divide-[#F0F0F8]">
                {activePending.map((user) => (
                  <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm"
                      style={{ backgroundColor: user.avatarColor || '#353750' }}
                    >
                      {user.avatar}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#353750] text-sm uppercase leading-tight">{user.name}</p>
                      <p className="text-xs text-[#6B6E8A] truncate mt-0.5">{user.email}</p>
                      <p className="text-[10px] text-[#B0B0C8] font-bold uppercase tracking-wide mt-1">
                        Requested: {formatDate(user.requestedAt)}
                      </p>
                    </div>

                    {/* Role Selector + Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <select
                        value={approvalRoles[user.id] || 'OPERATOR'}
                        onChange={(e) =>
                          setApprovalRoles((prev) => ({ ...prev, [user.id]: e.target.value }))
                        }
                        className="bg-white border-2 border-[#E0E0EC] text-[#353750] text-xs px-3 py-2 rounded-lg outline-none focus:border-[#353750] uppercase font-bold"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30 rounded-lg text-xs font-bold uppercase hover:bg-[#C8E6C9] transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Approve
                      </button>
                      <button
                        onClick={() => onRejectUser(user.id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#FFEBEE] text-[#C62828] border border-[#C62828]/30 rounded-lg text-xs font-bold uppercase hover:bg-[#FFCDD2] transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">block</span>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rejected Requests */}
          {rejectedPending.length > 0 && (
            <div className="bg-white border border-[#E0E0EC] rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#E0E0EC] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#C62828] text-xl">block</span>
                  <h2 className="font-bold text-[#353750] uppercase text-sm tracking-wide">Rejected Requests</h2>
                </div>
              </div>
              <div className="divide-y divide-[#F0F0F8]">
                {rejectedPending.map((user) => (
                  <div key={user.id} className="p-4 flex items-center gap-4 opacity-60">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm"
                      style={{ backgroundColor: user.avatarColor || '#666' }}
                    >
                      {user.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#353750] text-sm uppercase leading-none">{user.name}</p>
                      <p className="text-xs text-[#6B6E8A] truncate mt-1">{user.email}</p>
                    </div>
                    <span className="text-[10px] text-[#C62828] font-bold uppercase px-2 py-1 border border-[#C62828]/30 rounded-lg">REJECTED</span>
                    <button
                      onClick={() => onRemovePendingUser(user.id)}
                      className="w-9 h-9 rounded-lg border border-[#E0E0EC] hover:border-[#D32F2F] hover:bg-red-50 text-[#6B6E8A] hover:text-[#D32F2F] flex items-center justify-center transition-all"
                      title="Remove from list"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Approved Users ───────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="bg-white border border-[#E0E0EC] rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#E0E0EC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#353750] text-xl">group</span>
              <h2 className="font-bold text-[#353750] uppercase text-sm tracking-wide">Approved Users</h2>
            </div>
            <span className="text-xs font-mono bg-[#F4F4F6] text-[#6B6E8A] px-3 py-1 rounded-full border border-[#E0E0EC] font-bold">
              {approvedUsers.length} Total
            </span>
          </div>
          <div className="divide-y divide-[#F0F0F8] max-h-[500px] overflow-y-auto">
            {approvedUsers.map((user) => {
              const isSelf = user.id === currentUser?.id || (user.email && currentUser?.email && user.email.toLowerCase() === currentUser.email.toLowerCase());
              return (
                <div key={user.id} className="p-4 flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: user.avatarColor || '#fabd00' }}
                  >
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-[#353750] text-sm uppercase leading-none">{user.name}</p>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                        user.role === 'MANAGER'
                          ? 'border-[#FFF3E0] text-[#E65100] bg-[#FFF3E0]'
                          : 'border-[#E8F5E9] text-[#2E7D32] bg-[#E8F5E9]'
                      }`}>
                        {user.role}
                      </span>
                      <span className="text-[9px] font-bold text-[#6B6E8A] uppercase bg-[#F4F4F6] px-1.5 py-0.5 rounded border border-[#E0E0EC]">
                        {user.authType}
                      </span>
                      {isSelf && (
                        <span className="text-[9px] font-bold text-white bg-[#353750] px-1.5 py-0.5 rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B6E8A] truncate mt-1">
                      {user.companyEmail ? `Company: ${user.companyEmail}` : (user.email || 'PIN-based login')}
                    </p>
                  </div>
                  
                  {isSelf ? (
                    <button
                      disabled
                      className="w-9 h-9 rounded-lg border border-[#E0E0EC] opacity-40 text-[#B0B0C8] flex items-center justify-center cursor-not-allowed"
                      title="You cannot revoke your own account"
                    >
                      <span className="material-symbols-outlined text-base">lock</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmModal({ type: 'revoke', target: user })}
                      className="w-9 h-9 rounded-lg border border-[#E0E0EC] hover:border-[#D32F2F] hover:bg-red-50 text-[#6B6E8A] hover:text-[#D32F2F] flex items-center justify-center transition-all shrink-0"
                      title="Revoke Access"
                    >
                      <span className="material-symbols-outlined text-base">person_remove</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tab: Floor Zones ──────────────────────────────────────────────── */}
      {activeTab === 'zones' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Register Form */}
          <div className="flex-1 bg-white border border-[#E0E0EC] p-6 rounded-xl shadow-sm flex flex-col gap-4 max-w-md h-fit">
            <div className="border-b border-[#E0E0EC] pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#353750] text-2xl">add_box</span>
              <h2 className="font-bold text-[#353750] uppercase text-sm tracking-wide">Register Inspection Zone</h2>
            </div>
            <form onSubmit={handleSubmitZone} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold text-[#353750] tracking-wide">Zone Name / Code</label>
                <input
                  type="text"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full bg-[#F4F4F6] border-b-2 border-[#E0E0EC] focus:border-[#353750] text-[#353750] p-3 outline-none uppercase font-bold text-sm rounded-t-lg transition-colors"
                  placeholder="e.g. PLANT 05 - ASSEMBLY"
                />
                <span className="text-[9px] text-[#6B6E8A] uppercase mt-0.5 font-bold">Zone code will be forced to UPPERCASE</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold text-[#353750] tracking-wide">Description / Scope</label>
                <textarea
                  value={zoneDesc}
                  onChange={(e) => setZoneDesc(e.target.value)}
                  rows="3"
                  className="w-full bg-[#F4F4F6] border-b-2 border-[#E0E0EC] focus:border-[#353750] text-[#353750] p-3 outline-none resize-none text-sm rounded-t-lg transition-colors"
                  placeholder="Describe area limits, line numbers, or equipment scope..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold text-[#353750] tracking-wide">Department PIC (Responsible)</label>
                <select
                  value={zoneDept}
                  onChange={(e) => setZoneDept(e.target.value)}
                  className="w-full bg-[#F4F4F6] border-b-2 border-[#E0E0EC] focus:border-[#353750] text-[#353750] p-3 outline-none uppercase font-bold text-sm rounded-t-lg transition-colors cursor-pointer"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full h-12 rounded-xl text-white font-bold text-sm uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{ background: '#353750' }}
                onMouseEnter={e => e.currentTarget.style.background = '#23253A'}
                onMouseLeave={e => e.currentTarget.style.background = '#353750'}
              >
                <span className="material-symbols-outlined text-base">domain_add</span>
                Register Zone
              </button>
            </form>
          </div>

          {/* Active Zones List */}
          <div className="flex-grow bg-white border border-[#E0E0EC] p-6 rounded-xl shadow-sm flex flex-col gap-4">
            <div className="border-b border-[#E0E0EC] pb-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#353750] text-2xl">lists</span>
                <h2 className="font-bold text-[#353750] uppercase text-sm tracking-wide">Active Floor Zones</h2>
              </div>
              <span className="text-xs font-bold bg-[#F4F4F6] border border-[#E0E0EC] px-3 py-1 rounded-full text-[#6B6E8A] font-mono">
                {zones.length} Registered
              </span>
            </div>
            <div className="divide-y divide-[#F0F0F8] max-h-[500px] overflow-y-auto pr-1">
              {zones.map((zone) => (
                <div key={zone.id} className="py-4 flex justify-between items-center gap-4 hover:bg-[#F4F4F6] px-2 transition-colors rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="material-symbols-outlined text-[#6B6E8A] text-lg">location_on</span>
                      <h3 className="font-bold text-[#353750] text-sm uppercase truncate leading-none">{zone.name}</h3>
                      {zone.department && (
                        <span className="text-[9px] font-bold text-[#2E7D32] bg-[#E8F5E9] border border-[#2E7D32]/10 px-2 py-0.5 rounded uppercase">
                          PIC: {zone.department}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B6E8A] mt-2 truncate">{zone.description}</p>
                  </div>
                  <button
                    onClick={() => setConfirmModal({ type: 'deleteZone', target: zone })}
                    className="w-9 h-9 rounded-lg border border-[#E0E0EC] hover:border-[#D32F2F] hover:bg-red-50 text-[#6B6E8A] hover:text-[#D32F2F] flex items-center justify-center transition-all active:scale-95 shrink-0"
                    title="Unregister Zone"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              ))}
              {zones.length === 0 && (
                <div className="text-center py-12 text-[#6B6E8A] font-bold uppercase text-xs">
                  No inspection zones registered. Floor operations disabled.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Departments ──────────────────────────────────────────────── */}
      {activeTab === 'departments' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Register Form */}
          <div className="flex-1 bg-white border border-[#E0E0EC] p-6 rounded-xl shadow-sm flex flex-col gap-4 max-w-md h-fit">
            <div className="border-b border-[#E0E0EC] pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#353750] text-2xl">add_box</span>
              <h2 className="font-bold text-[#353750] uppercase text-sm tracking-wide">Register Department</h2>
            </div>
            <form onSubmit={handleSubmitDept} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs uppercase font-bold text-[#353750] tracking-wide">Department Name</label>
                <input
                  type="text"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full bg-[#F4F4F6] border-b-2 border-[#E0E0EC] focus:border-[#353750] text-[#353750] p-3 outline-none uppercase font-bold text-sm rounded-t-lg transition-colors"
                  placeholder="e.g. MAINTENANCE"
                />
                <span className="text-[9px] text-[#6B6E8A] uppercase mt-0.5 font-bold">Department will be forced to UPPERCASE</span>
              </div>
              <button
                type="submit"
                className="w-full h-12 rounded-xl text-white font-bold text-sm uppercase tracking-widest shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                style={{ background: '#353750' }}
                onMouseEnter={e => e.currentTarget.style.background = '#23253A'}
                onMouseLeave={e => e.currentTarget.style.background = '#353750'}
              >
                <span className="material-symbols-outlined text-base">domain_add</span>
                Register Department
              </button>
            </form>
          </div>

          {/* Active Departments List */}
          <div className="flex-grow bg-white border border-[#E0E0EC] p-6 rounded-xl shadow-sm flex flex-col gap-4">
            <div className="border-b border-[#E0E0EC] pb-2 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#353750] text-2xl">lists</span>
                <h2 className="font-bold text-[#353750] uppercase text-sm tracking-wide">Active Departments</h2>
              </div>
              <span className="text-xs font-bold bg-[#F4F4F6] border border-[#E0E0EC] px-3 py-1 rounded-full text-[#6B6E8A] font-mono">
                {departments.length} Registered
              </span>
            </div>
            <div className="divide-y divide-[#F0F0F8] max-h-[500px] overflow-y-auto pr-1">
              {departments.map((dept) => (
                <div key={dept.id} className="py-4 flex justify-between items-center gap-4 hover:bg-[#F4F4F6] px-2 transition-colors rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#6B6E8A] text-lg">corporate_fare</span>
                      <h3 className="font-bold text-[#353750] text-sm uppercase truncate leading-none">{dept.name}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmModal({ type: 'deleteDept', target: dept })}
                    className="w-9 h-9 rounded-lg border border-[#E0E0EC] hover:border-[#D32F2F] hover:bg-red-50 text-[#6B6E8A] hover:text-[#D32F2F] flex items-center justify-center transition-all active:scale-95 shrink-0"
                    title="Unregister Department"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              ))}
              {departments.length === 0 && (
                <div className="text-center py-12 text-[#6B6E8A] font-bold uppercase text-xs">
                  No departments registered.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Unified Confirmation Modal ─────────────────────────────────────── */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(53,55,80,0.6)', backdropFilter: 'blur(4px)', fontFamily: "'Nunito', sans-serif" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Color accent top */}
            <div className={`h-1.5 w-full ${confirmModal.type === 'revoke' ? 'bg-[#D32F2F]' : 'bg-[#F05731]'}`} />
            
            <div className="p-6">
              <div className="flex items-start gap-4 mb-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmModal.type === 'revoke' ? 'bg-red-50 border border-red-100' : 'bg-[#FFF5F3] border border-orange-100'
                }`}>
                  <span className={`material-symbols-outlined text-2xl ${
                    confirmModal.type === 'revoke' ? 'text-[#D32F2F]' : 'text-[#F05731]'
                  }`}>
                    {confirmModal.type === 'revoke' ? 'person_remove' : 'warning'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-[#353750] text-base">
                    {confirmModal.type === 'revoke' ? 'Revoke Access' : confirmModal.type === 'deleteZone' ? 'Unregister Zone' : 'Unregister Department'}
                  </h3>
                  <p className="text-sm text-[#6B6E8A] mt-1 leading-relaxed">
                    {confirmModal.type === 'revoke' ? (
                      <>
                        Are you sure you want to revoke access for{' '}
                        <span className="font-bold text-[#353750]">{confirmModal.target.name}</span>?
                      </>
                    ) : confirmModal.type === 'deleteZone' ? (
                      <>
                        Are you sure you want to unregister zone{' '}
                        <span className="font-bold text-[#353750]">{confirmModal.target.name}</span>?
                      </>
                    ) : (
                      <>
                        Are you sure you want to unregister department{' '}
                        <span className="font-bold text-[#353750]">{confirmModal.target.name}</span>?
                      </>
                    )}
                  </p>
                  {confirmModal.type === 'revoke' && confirmModal.target.email && (
                    <p className="text-xs text-[#6B6E8A] mt-1">{confirmModal.target.email}</p>
                  )}
                </div>
              </div>

              <div className={`border rounded-xl px-4 py-3 mb-5 flex items-start gap-2 ${
                confirmModal.type === 'revoke' ? 'bg-[#FFF5F3] border-red-100' : 'bg-[#FFF5F3] border-orange-100'
              }`}>
                <span className={`material-symbols-outlined text-base mt-0.5 shrink-0 ${
                  confirmModal.type === 'revoke' ? 'text-[#D32F2F]' : 'text-[#F05731]'
                }`}>
                  warning
                </span>
                <p className="text-xs text-[#6B6E8A] leading-relaxed">
                  {confirmModal.type === 'revoke' ? (
                    'This user will immediately lose access to the 5S Audit System. They will need to request access again to be re-approved.'
                  ) : confirmModal.type === 'deleteZone' ? (
                    'Unregistering this zone will remove it from active audits and floor maps. Past audit logs will remain intact.'
                  ) : (
                    'Unregistering this department will remove it from the available options for new audits. Past audit logs will remain intact.'
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 h-11 rounded-xl border-2 border-[#E0E0EC] text-[#353750] font-bold text-sm uppercase tracking-wide hover:bg-[#F4F4F6] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className="flex-1 h-11 rounded-xl text-white font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md"
                  style={{ background: confirmModal.type === 'revoke' ? '#D32F2F' : '#F05731' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = confirmModal.type === 'revoke' ? '#B71C1C' : '#D94520';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = confirmModal.type === 'revoke' ? '#D32F2F' : '#F05731';
                  }}
                >
                  <span className="material-symbols-outlined text-base">
                    {confirmModal.type === 'revoke' ? 'person_remove' : 'delete'}
                  </span>
                  {confirmModal.type === 'revoke' ? 'Revoke' : 'Unregister'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
