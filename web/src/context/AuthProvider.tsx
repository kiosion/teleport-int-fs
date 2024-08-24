import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { API_ENDPOINTS, API_ERRORS, API_URL } from '../lib/constants';

import type { APIError, APIResponse, UserSession } from '../types';

const AuthContext = createContext<{
  session: React.MutableRefObject<UserSession | undefined>;
  sessionError: React.MutableRefObject<APIError | undefined>;
  loading: boolean;
  isAuthed: () => boolean;
  syncAuth: () => Promise<void>;
  login: (data: UserSession) => void;
  logout: () => void;
}>({
  session: { current: undefined },
  sessionError: { current: undefined },
  loading: true,
  isAuthed: () => false,
  syncAuth: async () => {},
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const session = useRef<UserSession | undefined>();
  const sessionError = useRef<APIError | undefined>();

  const isAuthed = () =>
    session.current !== undefined &&
    new Date(session.current?.expires ?? 0).getTime() > Date.now();
  const login = (data: UserSession) => {
    session.current = data;
    sessionError.current = undefined;
  };
  const logout = () => (session.current = undefined);

  const syncAuth = async () => {
    if (!loading) {
      setLoading(true);
    }

    try {
      const res = await fetch(`${API_URL}/${API_ENDPOINTS.ME}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const json = (await res.json().catch((e) => ({
        status: 'error',
        error: {
          title: 'Failed to serialize response',
          detail: e?.message ?? 'An unknown error occurred',
        },
      }))) as APIResponse<UserSession>;

      if (json?.status !== 'ok' || !json.data) {
        if (json?.error?.detail === API_ERRORS.SESSION_EXPIRED) {
          throw new Error('Session expired');
        }

        if (
          json?.error?.detail !== API_ERRORS.AUTH_REQUIRED &&
          json.error?.detail !== API_ERRORS.SESSION_NOT_FOUND
        ) {
          throw new Error(json.error?.detail ?? 'Failed to fetch session');
        }

        return;
      }

      sessionError.current = undefined;
      login(json.data);
    } catch (e) {
      console.error('Failed to fetch session:', e);

      sessionError.current = {
        title: (e as Error)?.message
          ? 'Failed to fetch session: ' + (e as Error).message
          : 'Failed to fetch session',
      };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        sessionError,
        login,
        logout,
        isAuthed,
        loading,
        syncAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
