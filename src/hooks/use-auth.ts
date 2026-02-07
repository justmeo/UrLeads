"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  userId: string;
  email: string;
}

const TOKEN_KEY = "urleads_token";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (t) {
      localStorage.setItem(TOKEN_KEY, t);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      setTokenState(stored);
      // Verify token
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Invalid token");
        })
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          setTokenState(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setToken(data.token);
      setUser({ userId: data.userId, email: data.email });
      return data;
    },
    [setToken]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setToken(data.token);
      setUser({ userId: data.userId, email: data.email });
      return data;
    },
    [setToken]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, [setToken]);

  return { user, token, loading, login, register, logout };
}

export function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
