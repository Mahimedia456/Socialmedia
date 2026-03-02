import React, { createContext, useContext, useMemo, useState } from "react";
import { tokenStore } from "../lib/tokenStore.js";
import { loginApi, logoutApi, refreshTokenApi } from "../lib/authApi.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(tokenStore.getUser());
  const [accessToken, setAccessToken] = useState(tokenStore.getAccess());
  const [refreshToken, setRefreshToken] = useState(tokenStore.getRefresh());

  const isAuthed = !!accessToken && !!user;

  async function login(email, password) {
    const data = await loginApi({ email, password });

    tokenStore.setAccess(data.access_token);
    tokenStore.setRefresh(data.refresh_token);
    tokenStore.setUser(data.user);

    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);
    setUser(data.user);

    return data.user;
  }

  async function logout() {
    try {
      const rt = tokenStore.getRefresh();
      if (rt) await logoutApi({ refresh_token: rt });
    } finally {
      tokenStore.clear();
      setAccessToken("");
      setRefreshToken("");
      setUser(null);
    }
  }

  async function refreshAccessToken() {
    const rt = tokenStore.getRefresh();
    if (!rt) throw new Error("No refresh token");

    const data = await refreshTokenApi({ refresh_token: rt });
    tokenStore.setAccess(data.access_token);
    setAccessToken(data.access_token);
    return data.access_token;
  }

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      isAuthed,
      login,
      logout,
      refreshAccessToken,
      setUser,
    }),
    [user, accessToken, refreshToken, isAuthed]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}