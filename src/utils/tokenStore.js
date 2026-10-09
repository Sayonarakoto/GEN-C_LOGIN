const TOKEN_KEY = 'token';
const REFRESH_KEY = 'refreshToken';

// Migrate any legacy session-storage token so existing tabs stay signed in
const migrateLegacy = () => {
  try {
    const legacy = sessionStorage.getItem(TOKEN_KEY);
    if (legacy && !localStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TOKEN_KEY, legacy);
    }
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* storage unavailable */
  }
};

migrateLegacy();

export const tokenStore = {
  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch { /* ignore */ }
  },
  getRefreshToken() {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  setRefreshToken(token) {
    try {
      localStorage.setItem(REFRESH_KEY, token);
    } catch { /* ignore */ }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
    } catch { /* ignore */ }
  },
};
