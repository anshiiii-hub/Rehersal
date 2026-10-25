"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  workspace: string;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<AuthUser | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  refreshUser: async () => null,
  logout: async () => {},
});

export const AUTH_EVENT = "rehearsal-auth-changed";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Cache-Control": "no-store" },
      });
      if (res.ok) {
        const data = await res.json();
        const u = data.user || null;
        setUserState(u);
        return u;
      }
      setUserState(null);
      return null;
    } catch (err) {
      console.error("Failed to check auth state:", err);
      setUserState(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    if (u) {
      try {
        const current = JSON.parse(
          localStorage.getItem("rehearsal-preferences") || "{}",
        );
        localStorage.setItem(
          "rehearsal-preferences",
          JSON.stringify({
            ...current,
            name: u.name,
            workspace: u.workspace || current.workspace || "My rehearsal studio",
          }),
        );
        window.dispatchEvent(new Event("rehearsal-preferences"));
      } catch (err) {
        console.error("Failed to sync preferences from auth:", err);
      }
    }
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: u }));
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  };

  useEffect(() => {
    refreshUser();

    const handleAuthEvent = (e: Event) => {
      const custom = e as CustomEvent<AuthUser | null>;
      if (custom.detail !== undefined) {
        setUserState(custom.detail);
      }
    };
    window.addEventListener(AUTH_EVENT, handleAuthEvent);
    return () => window.removeEventListener(AUTH_EVENT, handleAuthEvent);
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
