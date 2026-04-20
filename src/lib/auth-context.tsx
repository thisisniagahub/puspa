'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

// ============================================================
// Types
// ============================================================

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "ops" | "finance" | "volunteer";
  avatar?: string | null;
  isActive: boolean;
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

// ============================================================
// Context
// ============================================================

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("puspa_token");
    const storedUser = localStorage.getItem("puspa_user");
    let parsedUser: User | null = null;

    if (storedToken && storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
      } catch {
        localStorage.removeItem("puspa_token");
        localStorage.removeItem("puspa_user");
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage init requires setState in effect
    setToken(storedToken);
    setUser(parsedUser);
    setIsLoading(false);
  }, []);

  // Login
  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/v1/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        return { success: false, error: json.error ?? "Gagal log masuk" };
      }

      const { token: newToken, user: userData } = json.data;

      localStorage.setItem("puspa_token", newToken);
      localStorage.setItem("puspa_user", JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);

      return { success: true };
    } catch {
      return { success: false, error: "Ralat sambungan" };
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    // Fire and forget API call
    if (token) {
      fetch("/api/v1/auth", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    localStorage.removeItem("puspa_token");
    localStorage.removeItem("puspa_user");
    setToken(null);
    setUser(null);
    router.push("/");
  }, [token, router]);

  // Permission check
  const hasPermission = useCallback(
    (permission: string) => {
      return user?.permissions?.includes(permission) ?? false;
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ============================================================
// Fetch helper with auth token
// ============================================================

export function getAuthHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function authFetch(url: string, token: string | null, options: RequestInit = {}) {
  const headers = {
    ...getAuthHeaders(token),
    ...(options.headers instanceof Headers
      ? Object.fromEntries(options.headers.entries())
      : (options.headers as Record<string, string>) ?? {}),
    "Content-Type": options.body instanceof FormData ? undefined : "application/json",
  };

  // Remove undefined Content-Type for FormData
  if (headers["Content-Type"] === undefined) delete headers["Content-Type"];

  return fetch(url, { ...options, headers });
}
