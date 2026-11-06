import React from 'react';

/* ── Orbia ring logomark ────────────────────────────────────────────────────── */
function OrbiaRing({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="18" stroke="white" strokeWidth="2.5" fill="none"/>
      <ellipse cx="20" cy="20" rx="10" ry="18" stroke="white" strokeWidth="1.5" fill="none"/>
      <ellipse cx="20" cy="20" rx="18" ry="8" stroke="white" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

/* ── Wave blob shapes inside the navy sidebar (matches image 2) ─────────────── */
function SidebarWaves() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 256 900"
      preserveAspectRatio="xMidYMid slice"
      style={{ pointerEvents: 'none' }}
    >
      {/* Blue teardrop / wave — leftmost */}
      <path
        d="M-60,0 C-60,0 20,80 10,280 C0,480 -80,600 -40,900 L-200,900 L-200,0 Z"
        fill="#29A9E0"
        opacity="0.85"
      />
      {/* Green teardrop — middle */}
      <path
        d="M-30,0 C-30,0 60,100 50,300 C40,500 -40,620 -10,900 L-160,900 L-160,0 Z"
        fill="#3DAA72"
        opacity="0.9"
      />
      {/* Gold teardrop — rightmost visible sliver */}
      <path
        d="M10,0 C10,0 100,120 90,320 C80,520 10,650 30,900 L-110,900 L-110,0 Z"
        fill="#FAB931"
        opacity="0.9"
      />
    </svg>
  );
}

export default function Layout({ 
  children, 
  currentView, 
  setCurrentView, 
  currentUser, 
  onLogout, 
  pendingCount = 0,
  isGoogleSynced = false,
  isGoogleConfigured = false,
  onConnectGoogle
}) {
  if (currentView === 'LOGIN') {
    return <>{children}</>;
  }

  const isManager = currentUser?.role === 'MANAGER';

  const navItems = isManager
    ? [
        { id: 'DASHBOARD',       label: 'Dashboard',          icon: 'dashboard' },
        { id: 'SAFETY_DASHBOARD',label: 'Safety Dashboard',   icon: 'health_and_safety' },
        { id: 'CHECKLIST',       label: 'Audit Checklist',    icon: 'fact_check' },
        { id: 'RED_TAG',         label: 'Red-Tag Flow',       icon: 'label_important' },
        { id: 'RED_TAG_REGISTRY',label: 'Red-Tag Registry',   icon: 'local_offer' },
        { id: 'ACTIONS',         label: 'Findings Follow-Up', icon: 'plumbing' },
        { id: 'SCHEDULE',        label: 'Audit Schedule',     icon: 'calendar_month' },
        { id: 'ADMIN',           label: 'Admin Settings',     icon: 'settings' },
      ]
    : [
        { id: 'CHECKLIST',       label: 'Audit Checklist',    icon: 'fact_check' },
        { id: 'RED_TAG',         label: 'Red-Tag Flow',       icon: 'label_important' },
        { id: 'RED_TAG_REGISTRY',label: 'Red-Tag Registry',   icon: 'local_offer' },
      ];

  return (
    <div className="bg-[#F4F4F6] text-[#353750] min-h-screen pb-20 lg:pb-0 lg:pl-64" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Top App Bar ──────────────────────────────────────────────────────── */}
      <header className="flex justify-between items-center px-6 w-full h-14 bg-white border-b border-[#E0E0EC] fixed top-0 left-0 right-0 z-40 lg:pl-[272px] shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#353750] text-xl">precision_manufacturing</span>
          <h1 className="text-base font-bold text-[#353750] tracking-wide uppercase">
            5S Audit System
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Google Sheets Sync status */}
          {isGoogleConfigured && (
            <button
              onClick={onConnectGoogle}
              className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-full uppercase border transition-all ${
                isGoogleSynced
                  ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/20 hover:bg-[#E8F5E9]/80'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 animate-pulse'
              }`}
              title={isGoogleSynced ? "Sheets Database Connected" : "Click to connect Google Sheets"}
            >
              <span className="material-symbols-outlined text-xs" style={{ fontSize: 13 }}>
                {isGoogleSynced ? 'cloud_done' : 'cloud_off'}
              </span>
              <span>{isGoogleSynced ? 'Sheets Sync On' : 'Sync Sheets'}</span>
            </button>
          )}

          {/* User chip */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#F4F4F6] rounded-full border border-[#E0E0EC]">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: currentUser?.avatarColor || '#353750' }}
            >
              {currentUser?.avatar || currentUser?.name?.slice(0,2) || 'U'}
            </div>
            <span className="text-xs font-semibold text-[#353750]">{currentUser?.name}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{
              background: currentUser?.role === 'MANAGER' ? '#FFF3E0' : '#E8F5E9',
              color: currentUser?.role === 'MANAGER' ? '#E65100' : '#2E7D32'
            }}>
              {currentUser?.role}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-xs font-bold text-[#6B6E8A] hover:text-[#353750] transition-colors border border-[#E0E0EC] hover:border-[#353750] px-3 py-1.5 rounded-full uppercase"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Exit
          </button>
        </div>
      </header>

      {/* ── Desktop Sidebar (image 2 style) ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 z-50" style={{ background: '#353750' }}>

        {/* Wave blob decorations */}
        <SidebarWaves />

        {/* Sidebar content — sits above SVG */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Logo area */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <OrbiaRing size={36} />
              <div>
                <div className="text-white font-bold text-base leading-tight">orbia</div>
                <div className="text-white/70 text-[10px] font-semibold leading-tight border-l border-white/40 pl-2 ml-1">
                  Building &amp; Infrastructure
                </div>
              </div>
            </div>
            {/* User info */}
            <div className="flex items-center gap-2 mt-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: currentUser?.avatarColor || '#F05731' }}
              >
                {currentUser?.avatar || currentUser?.name?.slice(0,2) || 'U'}
              </div>
              <div>
                <p className="text-white text-xs font-bold">{currentUser?.name || 'USER'}</p>
                <p className="text-white/60 text-[10px]">
                  {currentUser?.role === 'MANAGER' ? 'Operations Manager' : 'Floor Operator'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 px-2">
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Navigation</p>
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const showBadge = item.id === 'ADMIN' && pendingCount > 0;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all relative text-sm font-semibold ${
                    isActive
                      ? 'bg-white text-[#353750] shadow-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {isActive && (
                    <div className="w-1 h-4 rounded-full absolute right-2" style={{ background: '#F05731' }} />
                  )}
                  {showBadge && (
                    <span className="w-5 h-5 bg-[#F05731] text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-wide">System Status</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#3DAA72] animate-pulse" />
                <span className="text-white/50 text-[10px]">Optimal</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ─────────────────────────────────────────────────── */}
      <div className="pt-14">
        {children}
      </div>

      {/* ── Bottom Navigation (Mobile) ────────────────────────────────────────── */}
      <nav className="flex lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E0E0EC] shadow-lg"
           style={{ height: 64 }}>
        <div className="flex w-full items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const showBadge = item.id === 'ADMIN' && pendingCount > 0;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`relative flex flex-col items-center justify-center p-1.5 min-w-0 flex-1 transition-all ${
                  isActive ? 'text-[#353750]' : 'text-[#B0B0C8]'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ background: '#F05731' }} />
                )}
                <span className={`material-symbols-outlined text-xl ${isActive ? 'text-[#353750]' : 'text-[#B0B0C8]'}`}>
                  {item.icon}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-tight mt-0.5 ${isActive ? 'text-[#353750]' : 'text-[#B0B0C8]'}`}>
                  {item.label.split(' ')[0]}
                </span>
                {showBadge && (
                  <span className="absolute top-0 right-1.5 w-4 h-4 bg-[#F05731] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={onLogout}
            className="flex flex-col items-center justify-center p-1.5 flex-1 text-[#B0B0C8] hover:text-[#D32F2F] transition-colors"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="text-[9px] font-bold uppercase tracking-tight mt-0.5">Exit</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
