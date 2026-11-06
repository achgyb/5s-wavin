/**
 * GoogleAuthModal
 * Triggers real Google OAuth 2.0 via Google Identity Services (GIS).
 * Falls back to a manual entry form if GIS is not yet configured.
 */
import React, { useState, useEffect } from 'react';
import { signInWithGoogle, initGoogleAuth } from '../services/googleAuth';
import { isGoogleConfigured } from '../config/google';

export default function GoogleAuthModal({ onSelectAccount, onClose }) {
  const [status, setStatus] = useState('idle'); // idle | loading | error | fallback
  const [errorMsg, setErrorMsg] = useState('');

  // Fallback form state (used when Google is not configured)
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualError, setManualError] = useState('');

  const configured = isGoogleConfigured();

  useEffect(() => {
    if (configured) {
      // Pre-initialize auth when modal opens
      initGoogleAuth().catch(() => setStatus('fallback'));
    } else {
      setStatus('fallback');
    }
  }, [configured]);

  const handleGoogleSignIn = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      await initGoogleAuth();
      const userData = await signInWithGoogle();
      onSelectAccount(userData);
    } catch (err) {
      console.error('Google sign-in error:', err);
      const errType = err?.type || '';
      const errMsg  = err?.message || '';

      if (
        errType === 'popup_closed' ||
        errType === 'popup_closed_by_user' ||
        errMsg  === 'popup_closed'
      ) {
        // User just closed the popup — silently go back to idle
        setStatus('idle');
      } else if (
        errType === 'popup_failed_to_open' ||
        errMsg.toLowerCase().includes('popup')
      ) {
        // Browser blocked the popup
        setErrorMsg('Popup was blocked. Please allow popups for this site in your browser settings, then try again.');
        setStatus('error');
      } else if (errType === 'timeout') {
        setErrorMsg('Sign-in timed out. Please try again.');
        setStatus('idle');
      } else {
        setErrorMsg(errMsg || 'Google sign-in failed. Please try again.');
        setStatus('error');
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualName.trim()) { setManualError('Please enter your full name.'); return; }
    if (!manualEmail.trim() || !manualEmail.includes('@')) {
      setManualError('Please enter a valid email address.'); return;
    }
    const initials = manualName.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#1a73e8', '#34a853', '#ea4335', '#fbbc04', '#4285f4'];
    const avatarColor = colors[manualEmail.charCodeAt(0) % colors.length];
    onSelectAccount({
      name: manualName.trim(),
      email: manualEmail.trim().toLowerCase(),
      avatar: initials,
      avatarColor,
      googleId: `manual-${Date.now()}`,
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ fontFamily: "'Google Sans', Roboto, sans-serif" }}
      >
        {/* ── Google Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col items-center pt-8 pb-4 px-6 border-b border-gray-200">
          {/* Google Logo SVG */}
          <svg className="w-20 mb-4" viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg">
            <path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/>
            <path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/>
            <path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/>
            <path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/>
            <path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/>
            <path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" fill="#4285F4"/>
          </svg>
          <p className="text-gray-600 text-sm text-center">
            {configured
              ? 'Sign in with your Google Account to access the 5S Audit System'
              : 'Enter your details to request access to the 5S Audit System'}
          </p>
        </div>

        {/* ── Real Google Sign-In Button (when configured) ───────────────── */}
        {status !== 'fallback' && (
          <div className="px-6 py-6 flex flex-col gap-4">
            {/* Error banner */}
            {status === 'error' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="material-symbols-outlined text-red-500 text-base mt-0.5">error</span>
                <p className="text-xs text-red-700 font-medium">{errorMsg}</p>
              </div>
            )}

            {!configured && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="material-symbols-outlined text-amber-500 text-base mt-0.5">warning</span>
                <div>
                  <p className="text-xs text-amber-800 font-bold">Google not configured</p>
                  <p className="text-xs text-amber-700 mt-0.5">Fill in <code className="bg-amber-100 px-1 rounded">src/config/google.js</code> with your Client ID.</p>
                </div>
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin" />
                  <span className="text-sm text-gray-700 font-medium">Signing in…</span>
                </>
              ) : (
                <>
                  {/* Google G icon */}
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span className="text-sm text-gray-700 font-medium">Sign in with Google</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              New users will be placed in a pending approval queue
            </p>
          </div>
        )}

        {/* ── Fallback Manual Form ───────────────────────────────────────── */}
        {status === 'fallback' && (
          <form onSubmit={handleManualSubmit} className="px-6 py-4 flex flex-col gap-4">
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="material-symbols-outlined text-blue-500 text-base mt-0.5">info</span>
              <p className="text-xs text-blue-700">Enter your details to submit an access request.</p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Full Name</label>
              <input
                type="text"
                value={manualName}
                onChange={e => { setManualName(e.target.value); setManualError(''); }}
                placeholder="Your full name"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Email Address</label>
              <input
                type="email"
                value={manualEmail}
                onChange={e => { setManualEmail(e.target.value); setManualError(''); }}
                placeholder="you@example.com"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {manualError && <p className="text-xs text-red-500">{manualError}</p>}
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Continue
            </button>
          </form>
        )}

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Privacy</a>
          <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Terms</a>
          <button type="button" onClick={onClose} className="text-xs text-gray-500 hover:text-gray-800 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
