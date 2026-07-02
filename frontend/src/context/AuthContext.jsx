import { createContext, useContext, useEffect, useState } from 'react';
import { AuthAPI } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AuthAPI.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const u = await AuthAPI.login(username, password);
    setUser(u);
    return u;
  };

  const logout = async () => {
    try { await AuthAPI.logout(); } catch {}
    setUser(null);
  };

  const canEdit = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, canEdit }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
