import { createContext, useContext, useState, useCallback } from "react";
import apiClient from "../api/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("resumeiq_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email, password) => {
    const { data } = await apiClient.post("/auth/login", { email, password });
    localStorage.setItem("resumeiq_token", data.token);
    localStorage.setItem("resumeiq_user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    return apiClient.post("/auth/register", {
      name,
      email,
      password,
    });
  }, []);

  const updateUser = useCallback((nextUser) => {
    localStorage.setItem("resumeiq_user", JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("resumeiq_token");
    localStorage.removeItem("resumeiq_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
