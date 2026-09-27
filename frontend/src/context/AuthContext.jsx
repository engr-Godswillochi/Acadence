import { useCallback, useEffect, useState } from 'react';
import { AuthContext } from '../features/auth/auth.context.js';
import { authApi } from '../features/auth/auth.api.js';

const storageKey = 'acadence.accessToken';
function savedToken() {
  try { return sessionStorage.getItem(storageKey); } catch { return null; }
}
function storeToken(token) {
  try {
    if (token) sessionStorage.setItem(storageKey, token);
    else sessionStorage.removeItem(storageKey);
  } catch { /* In restricted browsers the session remains available in memory. */ }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(savedToken);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => savedToken() ? 'loading' : 'anonymous');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    authApi.me(token, controller.signal).then(({ user: currentUser }) => {
      setUser(currentUser);
      setStatus('authenticated');
    }).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) {
        storeToken(null);
        setToken(null);
        setUser(null);
        setStatus('anonymous');
      } else {
        setError(failure.message);
        setStatus('error');
      }
    });
    return () => controller.abort();
  }, [token, retry]);

  async function authenticate(action, input) {
    const result = await authApi[action](input);
    storeToken(result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);
    setStatus('authenticated');
  }

  const logout = useCallback(() => {
    storeToken(null);
    setToken(null);
    setUser(null);
    setStatus('anonymous');
    setError('');
  }, []);

  return <AuthContext.Provider value={{
    token, user, status, error, logout,
    login: (input) => authenticate('login', input),
    register: (input) => authenticate('register', input),
    registerAdmin: (input) => authenticate('registerAdmin', input),
    retry: () => { setStatus('loading'); setError(''); setRetry((value) => value + 1); },
  }}>{children}</AuthContext.Provider>;
}
