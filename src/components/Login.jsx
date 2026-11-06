import React, { useState } from 'react';
import GoogleAuthModal from './GoogleAuthModal';

/* ── Orbia B&I Wave SVG (matches picture 1 bottom decoration) ──────────────── */
function OrbiaWaveBottom() {
  return (
    <div className="absolute bottom-0 left-0 w-full pointer-events-none" style={{ height: 200 }}>
      <svg viewBox="0 0 1200 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        {/* Light gray subtle wave behind everything */}
        <path d="M0,160 C200,100 400,180 600,140 C800,100 1000,160 1200,130 L1200,200 L0,200 Z"
              fill="#EBEBEF" />
        {/* Orbia Navy — dominant wave */}
        <path d="M0,180 C150,120 350,200 550,160 C750,120 950,180 1200,150 L1200,200 L0,200 Z"
              fill="#353750" />
        {/* Green accent wave */}
        <path d="M-20,185 C120,130 280,190 450,160 C600,135 700,175 800,200 L0,200 Z"
              fill="#3DAA72" />
        {/* Coral accent wave */}
        <path d="M800,200 C900,155 1000,185 1100,165 C1150,158 1180,170 1200,165 L1200,200 Z"
              fill="#F05731" />
        {/* Gold accent */}
        <path d="M950,200 C1020,168 1100,185 1200,172 L1200,200 Z"
              fill="#FAB931" />
      </svg>
    </div>
  );
}

/* ── Orbia B&I Logo mark (simplified) ────────────────────────────────────────── */
function OrbiaLogo() {
  return (
    <div className="flex items-center gap-3">
      {/* Ring logomark */}
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" stroke="#353750" strokeWidth="2.5" fill="none"/>
        <ellipse cx="20" cy="20" rx="10" ry="18" stroke="#353750" strokeWidth="1.5" fill="none"/>
        <ellipse cx="20" cy="20" rx="18" ry="8" stroke="#353750" strokeWidth="1.5" fill="none"/>
      </svg>
      <div>
        <div className="text-xl font-bold text-[#353750] leading-tight tracking-wide">orbia</div>
        <div className="text-xs text-[#353750] font-semibold leading-tight" style={{ borderLeft: '2px solid #353750', paddingLeft: 6, marginLeft: 2 }}>
          Building &amp; Infrastructure
        </div>
      </div>
    </div>
  );
}

export default function Login({ onLogin, onGoogleSignUp, onGoogleLogin, approvedUsers }) {
  const [role, setRole] = useState('OPERATOR');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleStatus, setGoogleStatus] = useState(null);
  const [googleUserInfo, setGoogleUserInfo] = useState(null);

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setErrorMsg('');
    setPin('');
  };

  const handleInitializeSession = () => {
    if (!pin) { setErrorMsg('Please enter your PIN'); return; }
    const matchedUser = approvedUsers.find(
      (u) => u.authType === 'PIN' && u.role === role && u.pin === pin
    );
    if (matchedUser) {
      onLogin({ role: matchedUser.role, name: matchedUser.name, pin, authType: 'PIN' });
    } else {
      setErrorMsg('Invalid PIN. Please try again.');
    }
  };

  const handleGoogleAccountSelected = async (googleUserData) => {
    setShowGoogleModal(false);
    const result = await onGoogleSignUp(googleUserData);
    if (result.status === 'approved') {
      onGoogleLogin(result.user);
    } else {
      setGoogleStatus(result.status);
      setGoogleUserInfo(googleUserData);
    }
  };

  return (
    <div className="relative min-h-screen bg-white flex flex-col overflow-hidden" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Top header bar ─────────────────────────────────────────────────── */}
      <header className="w-full flex items-center justify-between px-8 py-4 z-10">
        <OrbiaLogo />
        <div className="flex items-center gap-2 text-sm text-[#6B6E8A] font-semibold">
          <span className="material-symbols-outlined text-lg">help_outline</span>
          Support
        </div>
      </header>

      {/* ── Thin accent top stripe ─────────────────────────────────────────── */}
      <div className="w-full h-1" style={{ background: 'linear-gradient(90deg, #3DAA72 0%, #29A9E0 33%, #F05731 66%, #FAB931 100%)' }} />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-52 pt-8 z-10">

        {/* Page title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#353750] mb-1">5S Factory Audit System</h1>
          <p className="text-sm text-[#6B6E8A] font-semibold">Sign in to continue to your workspace</p>
        </div>

        {/* ── Login card ──────────────────────────────────────────────────── */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#E0E0EC] overflow-hidden">

          {/* Card top bar — Orbia coral accent */}
          <div className="h-2 w-full" style={{ background: '#353750' }} />

          <div className="p-8 flex flex-col gap-5">

            {/* User avatar area */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[#F4F4F6] border-2 border-[#E0E0EC] flex items-center justify-center overflow-hidden">
                {googleUserInfo ? (
                  <div
                    className="w-full h-full flex items-center justify-center text-white text-2xl font-bold"
                    style={{ backgroundColor: googleUserInfo.avatarColor || '#353750' }}
                  >
                    {googleUserInfo.avatar}
                  </div>
                ) : (
                  <span className="material-symbols-outlined text-[#6B6E8A] text-5xl">account_circle</span>
                )}
              </div>
            </div>

            {/* Role toggle */}
            {!googleStatus && (
              <div className="flex rounded-lg overflow-hidden border border-[#E0E0EC] bg-[#F4F4F6]">
                {['OPERATOR', 'MANAGER'].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRoleSwitch(r)}
                    className={`flex-1 py-2.5 text-sm font-bold uppercase tracking-wide transition-all ${
                      role === r
                        ? 'bg-[#353750] text-white shadow-sm'
                        : 'text-[#6B6E8A] hover:text-[#353750]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}

            {/* PIN input */}
            {!googleStatus && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#6B6E8A] uppercase tracking-wider">
                  Access PIN
                </label>
                <div className="relative">
                  <input
                    className={`w-full border-2 rounded-lg px-4 h-12 text-[#353750] font-bold tracking-[0.4em] text-center placeholder:tracking-normal placeholder:font-normal placeholder:text-[#B0B0C8] outline-none transition-colors ${
                      errorMsg
                        ? 'border-[#D32F2F] bg-red-50'
                        : 'border-[#E0E0EC] bg-white focus:border-[#353750]'
                    }`}
                    placeholder="Enter PIN"
                    type="password"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); if (errorMsg) setErrorMsg(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleInitializeSession(); }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#B0B0C8] text-sm">lock</span>
                </div>
                {errorMsg && (
                  <p className="text-xs text-[#D32F2F] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {errorMsg}
                  </p>
                )}
              </div>
            )}

            {/* Google status messages */}
            {googleStatus === 'registered' && (
              <div className="p-4 rounded-lg border border-[#3DAA72]/40 bg-[#3DAA72]/5 text-center">
                <span className="material-symbols-outlined text-[#3DAA72] text-2xl block">pending</span>
                <p className="text-sm font-bold text-[#3DAA72] mt-1">Access Request Submitted</p>
                <p className="text-xs text-[#6B6E8A] mt-1">Awaiting admin approval.</p>
                <button onClick={() => { setGoogleStatus(null); setGoogleUserInfo(null); }} className="mt-2 text-xs text-[#353750] underline font-semibold">Back to Login</button>
              </div>
            )}
            {googleStatus === 'pending' && (
              <div className="p-4 rounded-lg border border-[#FAB931]/40 bg-[#FAB931]/5 text-center">
                <span className="material-symbols-outlined text-[#FAB931] text-2xl block">hourglass_top</span>
                <p className="text-sm font-bold text-[#FAB931] mt-1">Awaiting Approval</p>
                <p className="text-xs text-[#6B6E8A] mt-1">Your account is pending approval.</p>
                <button onClick={() => { setGoogleStatus(null); setGoogleUserInfo(null); }} className="mt-2 text-xs text-[#353750] underline font-semibold">Back to Login</button>
              </div>
            )}
            {googleStatus === 'rejected' && (
              <div className="p-4 rounded-lg border border-[#D32F2F]/40 bg-[#D32F2F]/5 text-center">
                <span className="material-symbols-outlined text-[#D32F2F] text-2xl block">block</span>
                <p className="text-sm font-bold text-[#D32F2F] mt-1">Access Denied</p>
                <p className="text-xs text-[#6B6E8A] mt-1">Contact your supervisor.</p>
                <button onClick={() => { setGoogleStatus(null); setGoogleUserInfo(null); }} className="mt-2 text-xs text-[#353750] underline font-semibold">Back to Login</button>
              </div>
            )}

            {/* Submit button */}
            {!googleStatus && (
              <button
                onClick={handleInitializeSession}
                className="w-full h-12 rounded-lg font-bold text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md"
                style={{ background: '#353750' }}
                onMouseEnter={e => e.currentTarget.style.background = '#23253A'}
                onMouseLeave={e => e.currentTarget.style.background = '#353750'}
              >
                <span className="material-symbols-outlined text-lg">login</span>
                Sign In
              </button>
            )}

            {/* Divider */}
            {!googleStatus && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#E0E0EC]"/>
                <span className="text-xs text-[#B0B0C8] font-semibold uppercase">or</span>
                <div className="flex-1 h-px bg-[#E0E0EC]"/>
              </div>
            )}

            {/* Google sign-in */}
            {!googleStatus && (
              <button
                onClick={() => setShowGoogleModal(true)}
                className="w-full h-12 rounded-lg border-2 border-[#E0E0EC] bg-white hover:bg-[#F4F4F6] text-[#353750] font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-[#B0B0C8] text-center mt-5 font-medium">
          New users must request access and await administrator approval
        </p>
      </main>

      {/* ── Bottom wave decoration (matches image 1) ────────────────────────── */}
      <OrbiaWaveBottom />

      {/* Google Auth Modal */}
      {showGoogleModal && (
        <GoogleAuthModal
          onSelectAccount={handleGoogleAccountSelected}
          onClose={() => setShowGoogleModal(false)}
        />
      )}
    </div>
  );
}
