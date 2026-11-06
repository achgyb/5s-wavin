/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GOOGLE AUTH SERVICE
 * Manages OAuth 2.0 token lifecycle using Google Identity Services (GIS).
 *
 * Flow:
 *   1. initGoogleAuth()       — Wait for GIS script + set up token client
 *   2. signInWithGoogle()     — Open Google account picker popup
 *   3. getValidToken()        — Return cached token (or refresh if expired)
 *   4. signOut()              — Clear tokens
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { GOOGLE_CONFIG } from '../config/google';

/** Internal state */
let _tokenData = JSON.parse(localStorage.getItem('5s_googleToken')) || null;
let _tokenClient = null;
let _pendingResolve = null;
let _pendingReject = null;
let _initPromise = null; // singleton — only initialize once

const _saveToken = (data) => {
  _tokenData = data;
  if (data) {
    localStorage.setItem('5s_googleToken', JSON.stringify(data));
  } else {
    localStorage.removeItem('5s_googleToken');
  }
};

/**
 * Wait for GIS script to fully load INCLUDING google.accounts.oauth2.
 * Polls every 100ms, times out after 10 seconds.
 */
export const initGoogleAuth = () => {
  // Return the same promise if already initializing
  if (_initPromise) return _initPromise;

  _initPromise = new Promise((resolve, reject) => {
    // Already ready?
    if (_isGisReady()) {
      _setupTokenClient(resolve, reject);
      return;
    }

    let attempts = 0;
    const MAX_ATTEMPTS = 100; // 10 seconds @ 100ms
    const interval = setInterval(() => {
      attempts++;
      if (_isGisReady()) {
        clearInterval(interval);
        _setupTokenClient(resolve, reject);
      } else if (attempts >= MAX_ATTEMPTS) {
        clearInterval(interval);
        _initPromise = null; // allow retry
        reject(new Error(
          'Google Identity Services failed to load. ' +
          'Check your internet connection and make sure popups are allowed.'
        ));
      }
    }, 100);
  });

  return _initPromise;
};

/** Check that the specific API we need is available */
function _isGisReady() {
  return (
    typeof window !== 'undefined' &&
    typeof window.google !== 'undefined' &&
    typeof window.google.accounts !== 'undefined' &&
    typeof window.google.accounts.oauth2 !== 'undefined' &&
    typeof window.google.accounts.oauth2.initTokenClient === 'function'
  );
}

function _setupTokenClient(resolve, reject) {
  try {
    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CONFIG.CLIENT_ID,
      // Note: We only request identity scopes now. The Apps Script backend
      // handles the spreadsheet authorization as the admin.
      scope: [
        'openid',
        'email',
        'profile',
      ].join(' '),
      callback: _handleTokenResponse,
      error_callback: (gisError) => {
        // GIS error_callback receives an object like { type: 'popup_closed_by_user' }
        const errType = gisError?.type || gisError?.error || 'unknown';
        const msgMap = {
          popup_failed_to_open:
            'Popup was blocked by your browser. Please allow popups for this site and try again.',
          popup_closed_by_user: 'popup_closed',
          popup_closed:         'popup_closed',
          access_denied:        'You denied access. Please try again and click "Allow".',
        };
        const message = msgMap[errType] || `Sign-in error (${errType}). Please try again.`;
        const error = new Error(message);
        error.type = errType;

        if (_pendingReject) {
          _pendingReject(error);
          _pendingResolve = null;
          _pendingReject = null;
        }
      },
    });

    if (!_tokenClient || typeof _tokenClient.requestAccessToken !== 'function') {
      const keys = _tokenClient ? Object.keys(_tokenClient).join(', ') : 'none';
      const type = typeof _tokenClient;
      throw new Error(
        `initTokenClient did not return a valid token client. ` +
        `Type: ${type}, Keys: [${keys}], ` +
        `Client ID: >>>${GOOGLE_CONFIG.CLIENT_ID}<<<`
      );
    }

    resolve();
  } catch (err) {
    _initPromise = null; // allow retry
    reject(err);
  }
}

function _handleTokenResponse(tokenResponse) {
  if (tokenResponse.error) {
    const err = new Error(`Token error: ${tokenResponse.error}`);
    err.type = tokenResponse.error;
    if (_pendingReject) _pendingReject(err);
    _pendingResolve = null;
    _pendingReject = null;
    return;
  }

  const expiresAt = Date.now() + (tokenResponse.expires_in - 60) * 1000;
  _saveToken({ ...(_tokenData || {}), access_token: tokenResponse.access_token, expires_at: expiresAt });

  if (_pendingResolve) _pendingResolve(_tokenData);
  _pendingResolve = null;
  _pendingReject = null;
}

/**
 * Open the Google OAuth popup and get user info + access token.
 * Includes a 90-second safety timeout.
 */
export const signInWithGoogle = () => {
  return new Promise((resolve, reject) => {
    if (!_tokenClient || typeof _tokenClient.requestAccessToken !== 'function') {
      reject(new Error('Google Auth not initialized. Call initGoogleAuth() first.'));
      return;
    }

    let settled = false;
    const settle = (fn, val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      _pendingResolve = null;
      _pendingReject = null;
      fn(val);
    };

    // Safety net — if the popup never responds, stop spinning
    const timeoutId = setTimeout(() => {
      const err = new Error('Sign-in timed out. Please try again.');
      err.type = 'timeout';
      settle(reject, err);
    }, 90_000);

    _pendingResolve = async (tokenData) => {
      try {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        if (!profileRes.ok) throw new Error(`userinfo fetch failed: ${profileRes.status}`);
        const profile = await profileRes.json();

        const initials = (profile.name || profile.email || 'U')
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        const palette = ['#1a73e8', '#34a853', '#ea4335', '#fbbc04', '#4285f4', '#0f9d58'];
        const avatarColor = palette[(profile.email || '').charCodeAt(0) % palette.length];

        _saveToken({
          ...tokenData,
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
          sub: profile.sub,
          avatar: initials,
          avatarColor,
        });

        settle(resolve, {
          accessToken: _tokenData.access_token,
          email:       _tokenData.email,
          name:        _tokenData.name,
          picture:     _tokenData.picture,
          googleId:    _tokenData.sub,
          avatar:      _tokenData.avatar,
          avatarColor: _tokenData.avatarColor,
        });
      } catch (err) {
        settle(reject, err);
      }
    };

    _pendingReject = (err) => settle(reject, err);

    try {
      _tokenClient.requestAccessToken();
    } catch (err) {
      settle(reject, err);
    }
  });
};

/**
 * Get a valid access token — silently refreshes if expired.
 */
export const getValidToken = () => {
  return new Promise((resolve, reject) => {
    if (!_tokenData?.access_token) {
      reject(new Error('Not signed in. Call signInWithGoogle() first.'));
      return;
    }
    if (Date.now() < (_tokenData.expires_at || 0)) {
      resolve(_tokenData.access_token);
      return;
    }
    // Token expired — silent refresh
    let settled = false;
    const settle = (fn, val) => { if (!settled) { settled = true; fn(val); } };
    _pendingResolve = (data) => settle(resolve, data.access_token);
    _pendingReject = (err)  => settle(reject, err);
    // passing prompt: '' skips the account selector if they are already logged in
    _tokenClient.requestAccessToken({ prompt: '' });
  });
};

/** Revoke token and clear session */
export const signOut = () => {
  if (_tokenData?.access_token) {
    window.google?.accounts?.oauth2?.revoke(_tokenData.access_token);
  }
  _saveToken(null);
};

/** True if we have a non-expired cached token */
export const isSignedIn = () =>
  !!_tokenData?.access_token && Date.now() < (_tokenData?.expires_at || 0);

/** Return cached user info without making a request */
export const getCachedUser = () => {
  if (!_tokenData) return null;
  return {
    email:       _tokenData.email,
    name:        _tokenData.name,
    picture:     _tokenData.picture,
    googleId:    _tokenData.sub,
    avatar:      _tokenData.avatar,
    avatarColor: _tokenData.avatarColor,
  };
};
