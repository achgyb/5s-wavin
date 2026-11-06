import React, { useState } from 'react';

/* ── Orbia B&I Wave SVG (matches brand bottom decoration) ──────────────── */
function OrbiaWaveBottom() {
  return (
    <div className="absolute bottom-0 left-0 w-full pointer-events-none" style={{ height: 200 }}>
      <svg viewBox="0 0 1200 200" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        {/* Light gray subtle wave */}
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

/* ── Orbia B&I Logo mark ────────────────────────────────────────── */
function OrbiaLogo() {
  return (
    <div className="flex items-center gap-3">
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

export default function Login({ onLogin, approvedUsers = [] }) {
  const [role, setRole] = useState('OPERATOR');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    setErrorMsg('');
  };

  const handleSignIn = (e) => {
    if (e) e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setErrorMsg('Masukkan username / ID pengguna');
      return;
    }
    if (!cleanPassword) {
      setErrorMsg('Masukkan password');
      return;
    }

    // Match against approved users (support username match, email match, or legacy PIN match)
    const matchedUser = approvedUsers.find((u) => {
      const uName = (u.username || '').toLowerCase();
      const uEmail = (u.email || '').toLowerCase();
      const isUserMatch = uName === cleanUsername || uEmail === cleanUsername || u.name.toLowerCase() === cleanUsername;
      
      if (!isUserMatch) return false;

      // Check password or PIN
      const validPass = u.password || u.pin;
      return validPass === cleanPassword || (u.pin && u.pin === cleanPassword);
    });

    if (matchedUser) {
      // Auto-update to matched user's role
      onLogin({
        ...matchedUser,
        role: matchedUser.role || role,
      });
    } else {
      // Check if user exists but wrong password
      const userExists = approvedUsers.some((u) => {
        const uName = (u.username || '').toLowerCase();
        const uEmail = (u.email || '').toLowerCase();
        return uName === cleanUsername || uEmail === cleanUsername;
      });

      if (userExists) {
        setErrorMsg('Password salah. Silakan coba lagi.');
      } else {
        setErrorMsg('Username tidak terdaftar. Periksa kembali atau gunakan akun demo di bawah.');
      }
    }
  };

  const fillQuickAccount = (quickUser, quickPass, quickRole) => {
    setUsername(quickUser);
    setPassword(quickPass);
    setRole(quickRole);
    setErrorMsg('');
  };

  return (
    <div className="relative min-h-screen bg-white flex flex-col overflow-hidden" style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Top header bar ─────────────────────────────────────────────────── */}
      <header className="w-full flex items-center justify-between px-6 md:px-8 py-4 z-10">
        <OrbiaLogo />
        <div className="flex items-center gap-2 text-sm text-[#6B6E8A] font-semibold">
          <span className="material-symbols-outlined text-lg">verified_user</span>
          Wavin 5S System
        </div>
      </header>

      {/* ── Thin accent top stripe ─────────────────────────────────────────── */}
      <div className="w-full h-1" style={{ background: 'linear-gradient(90deg, #3DAA72 0%, #29A9E0 33%, #F05731 66%, #FAB931 100%)' }} />

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-48 pt-6 z-10">

        {/* Page title */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#353750] mb-1 tracking-tight">5S Factory Audit System</h1>
          <p className="text-sm text-[#6B6E8A] font-semibold">Silakan masuk menggunakan akun Anda</p>
        </div>

        {/* ── Login card ──────────────────────────────────────────────────── */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E0E0EC] overflow-hidden">

          {/* Card top bar */}
          <div className="h-2 w-full" style={{ background: '#353750' }} />

          <form onSubmit={handleSignIn} className="p-6 md:p-8 flex flex-col gap-4">

            {/* Avatar header */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-[#F4F4F6] border border-[#E0E0EC] flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[#353750] text-4xl">
                  {role === 'MANAGER' ? 'manage_accounts' : 'engineering'}
                </span>
              </div>
              <span className="text-xs font-bold text-[#6B6E8A] uppercase tracking-wider">
                Masuk Sebagai {role === 'MANAGER' ? 'Manager / Auditor' : 'Operator Pabrik'}
              </span>
            </div>

            {/* Role switch toggle */}
            <div className="flex rounded-xl overflow-hidden border border-[#E0E0EC] bg-[#F4F4F6] p-1 gap-1">
              {['OPERATOR', 'MANAGER'].map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => handleRoleSwitch(r)}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    role === r
                      ? 'bg-[#353750] text-white shadow-sm'
                      : 'text-[#6B6E8A] hover:text-[#353750]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Username input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#353750] uppercase tracking-wider">
                Username / ID Pengguna
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#9E9EAF] text-lg">person</span>
                <input
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="w-full pl-11 pr-4 h-12 rounded-xl border border-[#D5D5E2] focus:border-[#353750] focus:ring-2 focus:ring-[#353750]/15 outline-none font-semibold text-[#353750] text-sm transition-all"
                  placeholder="Contoh: operator atau admin"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); if (errorMsg) setErrorMsg(''); }}
                />
              </div>
            </div>

            {/* Password input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#353750] uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#9E9EAF] text-lg">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-11 pr-11 h-12 rounded-xl border border-[#D5D5E2] focus:border-[#353750] focus:ring-2 focus:ring-[#353750]/15 outline-none font-semibold text-[#353750] text-sm transition-all"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errorMsg) setErrorMsg(''); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9E9EAF] hover:text-[#353750] transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-[#D32F2F] text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="w-full h-12 rounded-xl font-bold text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all active:scale-[0.99] shadow-md mt-1 cursor-pointer"
              style={{ background: '#353750' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#23253A'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#353750'}
            >
              <span className="material-symbols-outlined text-lg">login</span>
              Masuk ke Aplikasi
            </button>

            {/* Quick Login Chips for Demo / Testing */}
            <div className="mt-2 pt-3 border-t border-[#F0F0F8] flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#8A8DA8] uppercase tracking-wider text-center">
                Akun Cepat (Quick Login):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillQuickAccount('operator', 'operator123', 'OPERATOR')}
                  className="p-2 rounded-lg border border-[#E0E0EC] hover:border-[#3DAA72] bg-[#F9F9FB] hover:bg-[#E8F5E9]/30 text-left transition-all"
                >
                  <div className="text-[11px] font-bold text-[#3DAA72] uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">engineering</span>
                    Operator
                  </div>
                  <div className="text-[10px] text-[#6B6E8A] font-mono mt-0.5">operator / operator123</div>
                </button>

                <button
                  type="button"
                  onClick={() => fillQuickAccount('admin', 'admin123', 'MANAGER')}
                  className="p-2 rounded-lg border border-[#E0E0EC] hover:border-[#F05731] bg-[#F9F9FB] hover:bg-[#FFF5F3] text-left transition-all"
                >
                  <div className="text-[11px] font-bold text-[#F05731] uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">manage_accounts</span>
                    Manager
                  </div>
                  <div className="text-[10px] text-[#6B6E8A] font-mono mt-0.5">admin / admin123</div>
                </button>
              </div>
            </div>

          </form>
        </div>

        <p className="text-xs text-[#8A8DA8] text-center mt-5 font-medium">
          Orbia Building &amp; Infrastructure — Wavin Plant 5S Audit
        </p>
      </main>

      {/* ── Bottom wave decoration ────────────────────────── */}
      <OrbiaWaveBottom />
    </div>
  );
}
