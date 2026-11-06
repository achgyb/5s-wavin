import React, { useState } from 'react';

/**
 * CompanyEmailModal
 * Shown immediately after a newly-approved Google user signs in for the first time.
 * Collects the user's corporate/company email address and department PIC which will be used for:
 *   – Audit booking confirmations
 *   – Task assignment & due-date reminders
 *   – 5S audit result summaries
 *   – Status change notifications & randomized audit assignments
 */
export default function CompanyEmailModal({ user, departments = [], onSubmit }) {
  const [companyEmail, setCompanyEmail] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!companyEmail.trim()) {
      setError('Please enter your company email address.');
      return;
    }
    if (!isValidEmail(companyEmail)) {
      setError('Please enter a valid email address (e.g. name@orbia.com).');
      return;
    }
    if (!selectedDept) {
      setError('Please select your department.');
      return;
    }
    setSubmitting(true);
    // Small artificial delay so the UI feels intentional
    setTimeout(() => onSubmit(companyEmail.trim().toLowerCase(), selectedDept), 400);
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(53,55,80,0.75)', backdropFilter: 'blur(6px)', fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* ── Top accent stripe ─────────────────────────────────────────────── */}
        <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #3DAA72 0%, #29A9E0 33%, #F05731 66%, #FAB931 100%)' }} />

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="px-8 pt-7 pb-5 border-b border-[#E0E0EC]">
          {/* Orbia ring icon */}
          <div className="flex items-center gap-3 mb-5">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="#353750" strokeWidth="2.5" fill="none"/>
              <ellipse cx="20" cy="20" rx="10" ry="18" stroke="#353750" strokeWidth="1.5" fill="none"/>
              <ellipse cx="20" cy="20" rx="18" ry="8" stroke="#353750" strokeWidth="1.5" fill="none"/>
            </svg>
            <div>
              <p className="text-base font-bold text-[#353750] leading-tight">orbia</p>
              <p className="text-[10px] text-[#353750] font-semibold leading-tight border-l border-[#353750] pl-1.5 ml-0.5">
                Building &amp; Infrastructure
              </p>
            </div>
          </div>

          {/* User greeting */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold shrink-0 shadow-md"
              style={{ backgroundColor: user.avatarColor || '#353750' }}
            >
              {user.avatar}
            </div>
            <div>
              <p className="text-base font-bold text-[#353750]">Welcome, {user.name.split(' ')[0]}! 👋</p>
              <p className="text-xs text-[#6B6E8A] font-medium">Your access has been approved.</p>
            </div>
          </div>

          <h2 className="text-lg font-bold text-[#353750] mb-1">Complete Your Profile</h2>
          <p className="text-sm text-[#6B6E8A] leading-relaxed">
            Please provide your <span className="font-bold text-[#353750]">company email address</span> and <span className="font-bold text-[#353750]">department</span> to complete your setup.
          </p>
        </div>

        {/* ── Form body ────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-5">

          {/* Google email (read-only reference) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#6B6E8A] uppercase tracking-wider">
              Google Account (Sign-in email)
            </label>
            <div className="flex items-center gap-3 bg-[#F4F4F6] border border-[#E0E0EC] rounded-lg px-4 h-11">
              <svg width="16" height="16" viewBox="0 0 48 48" className="shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span className="text-sm text-[#6B6E8A] truncate">{user.email}</span>
              <span className="material-symbols-outlined text-[#3DAA72] text-base ml-auto shrink-0">verified</span>
            </div>
          </div>

          {/* Company email input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#353750] uppercase tracking-wider">
              Company Email Address <span className="text-[#F05731]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#6B6E8A] text-lg">mail</span>
              <input
                type="email"
                value={companyEmail}
                onChange={(e) => { setCompanyEmail(e.target.value); if (error) setError(''); }}
                placeholder="your.name@orbia.com"
                autoFocus
                className={`w-full border-2 rounded-lg pl-10 pr-4 h-12 text-[#353750] font-semibold text-sm outline-none transition-colors placeholder:font-normal placeholder:text-[#B0B0C8] ${
                  error && !companyEmail.trim()
                    ? 'border-[#D32F2F] bg-red-50'
                    : 'border-[#E0E0EC] bg-white focus:border-[#353750]'
                }`}
              />
            </div>
          </div>

          {/* Department selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#353750] uppercase tracking-wider">
              Your Department <span className="text-[#F05731]">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#6B6E8A] text-lg">corporate_fare</span>
              <select
                value={selectedDept}
                onChange={(e) => { setSelectedDept(e.target.value); if (error) setError(''); }}
                className={`w-full border-2 rounded-lg pl-10 pr-4 h-12 text-[#353750] font-semibold text-sm outline-none transition-colors appearance-none bg-white cursor-pointer ${
                  error && !selectedDept
                    ? 'border-[#D32F2F] bg-red-50'
                    : 'border-[#E0E0EC] focus:border-[#353750]'
                }`}
              >
                <option value="">-- Select Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined pointer-events-none text-[#6B6E8A] text-lg">arrow_drop_down</span>
            </div>
          </div>

          {error && (
            <p className="text-xs text-[#D32F2F] font-semibold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-xl text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md disabled:opacity-70"
            style={{ background: submitting ? '#6B6E8A' : '#353750' }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#23253A'; }}
            onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = '#353750'; }}
          >
            {submitting ? (
              <>
                <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                Saving…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">check_circle</span>
                Save &amp; Enter System
              </>
            )}
          </button>

          <p className="text-[11px] text-[#B0B0C8] text-center">
            Your department and email are used to manage active audit schedules.
          </p>
        </form>
      </div>
    </div>
  );
}
