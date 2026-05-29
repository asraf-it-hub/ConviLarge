import { createContext, useContext, useMemo, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("convilarge_user");
    return stored ? JSON.parse(stored) : null;
  });

  async function login(payload) {
    const { data } = await api.post("/auth/login", payload);
    localStorage.setItem("convilarge_token", data.token);
    localStorage.setItem("convilarge_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function signup(payload) {
    const { data } = await api.post("/auth/signup", payload);
    localStorage.setItem("convilarge_token", data.token);
    localStorage.setItem("convilarge_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("convilarge_token");
    localStorage.removeItem("convilarge_user");
    setUser(null);
  }

  const value = useMemo(() => ({ user, login, signup, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
