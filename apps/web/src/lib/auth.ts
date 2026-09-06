export interface UserSession {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
    englishLevel?: string | null;
    learningGoal?: string | null;
  };
}

export const authStorage = {
  setTokens(accessToken: string, refreshToken: string, user?: UserSession) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    if (user) {
      localStorage.setItem('user_session', JSON.stringify(user));
    }
  },

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  },

  getUser(): UserSession | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('user_session');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  clear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_session');
  },
};
