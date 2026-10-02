"use client";

import * as React from "react";
import { User } from "@/types/user";
import { MOCK_USER } from "@/lib/mock-data/user.mock";
import { mockAuthService, SignupRequestData } from "./mock-auth";
import { isMockMode } from "@/lib/repositories";
import { getApiBaseUrl } from "@/lib/repositories/api/api-client";

// ─── Storage keys ─────────────────────────────────────────────────────────────
const LIVE_TOKEN_KEY = "decisionos_auth_token";
const LIVE_USER_KEY = "decisionos_live_user";
const EXPLICIT_LOGOUT_KEY = "decisionos_explicit_logout";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    data: SignupRequestData
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (
    data: Partial<User>
  ) => Promise<{ success: boolean; error?: string }>;
  loginAsDefault: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// ─── Helper: map raw backend UserResponse → frontend User ─────────────────────
// Backend returns snake_case fields with optional camelCase aliases.
// We read both and prefer whichever is present.
function mapBackendUser(u: any): User {
  return {
    id: u.id || u.userId || "",
    email: u.email || "",
    firstName: u.first_name || u.firstName || u.name?.split(" ")[0] || "User",
    lastName:
      u.last_name ||
      u.lastName ||
      u.name?.split(" ").slice(1).join(" ") ||
      "",
    fullName: u.full_name || u.fullName || u.name || "Enterprise User",
    title: u.title || "",
    role: u.role || "executive",
    department: u.department || "",
    organizationId:
      u.organization_id || u.organizationId || "org_live",
    organizationName:
      u.organization_name || u.organizationName || "Enterprise Business",
    status: u.status || "active",
    createdAt:
      u.created_at || u.createdAt || new Date().toISOString(),
    lastLoginAt:
      u.last_login_at || u.lastLoginAt || new Date().toISOString(),
    preferences: {
      theme: "dark",
      defaultCurrency: "INR",
      defaultTimeframe: "30d",
      notifications: {
        criticalAlerts: true,
        weeklyDigest: true,
        decisionApproved: true,
        dnaDeviations: true,
      },
    },
  };
}

// ─── Helper: call GET /api/auth/me to validate token and fetch live user ───────
async function fetchLiveUserFromToken(token: string): Promise<User | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return null;

    const json = await res.json();

    // Backend wraps in ApiResponse<UserResponse>: { success, data, message }
    const rawUser = json?.data || json;
    if (!rawUser || !rawUser.email) return null;

    return mapBackendUser(rawUser);
  } catch {
    return null;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      try {
        // ── MOCK MODE ───────────────────────────────────────────────────────
        if (isMockMode()) {
          const stored = mockAuthService.getStoredUser();

          if (stored) {
            if (!cancelled) setUser(stored);
            return;
          }

          const hasLoggedOut = localStorage.getItem(EXPLICIT_LOGOUT_KEY);

          if (!hasLoggedOut) {
            mockAuthService.setStoredUser(MOCK_USER);
            if (!cancelled) setUser(MOCK_USER);
          } else {
            if (!cancelled) setUser(null);
          }
          return;
        }

        // ── LIVE MODE ───────────────────────────────────────────────────────
        const token = localStorage.getItem(LIVE_TOKEN_KEY);

        // No token → not authenticated.
        if (!token) {
          if (!cancelled) setUser(null);
          return;
        }

        // ── Optimistic restore from cache ──────────────────────────────────
        // If a cached live user is present, restore it immediately and release
        // isLoading so AuthGuard passes through right away on every page load.
        // Then validate the token against /api/auth/me in the background.
        // If the background check fails (token expired / revoked), we clear the
        // session and redirect — but we do NOT hold the spinner hostage while
        // waiting for the network round-trip on every navigation.
        const cachedLiveUser = localStorage.getItem(LIVE_USER_KEY);
        if (cachedLiveUser) {
          try {
            const parsed = JSON.parse(cachedLiveUser);
            if (!cancelled) {
              setUser(parsed);
              setIsLoading(false); // ← release the guard NOW, before /me call
            }
          } catch {
            // Corrupt cache — fall through to full validation below.
          }
        }

        // Validate / refresh the token against /api/auth/me.
        // If we already released isLoading above, this runs silently in the
        // background. If there was no cache, isLoading is still true and the
        // finally block will release it after this await.
        const liveUser = await fetchLiveUserFromToken(token);

        if (cancelled) return;

        if (liveUser) {
          // Refresh cached user with latest data from backend.
          localStorage.setItem(LIVE_USER_KEY, JSON.stringify(liveUser));
          setUser(liveUser);
        } else {
          // Token is expired or invalid — clear everything, force re-login.
          localStorage.removeItem(LIVE_TOKEN_KEY);
          localStorage.removeItem(LIVE_USER_KEY);
          setUser(null);
        }
      } catch {
        if (!cancelled) {
          if (isMockMode()) {
            setUser(MOCK_USER);
          } else {
            setUser(null);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      localStorage.removeItem(EXPLICIT_LOGOUT_KEY);

      // ── LIVE BACKEND LOGIN ────────────────────────────────────────────────
      if (!isMockMode()) {
        const baseUrl = getApiBaseUrl();

        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        });

        const json = await res.json();

        if (res.ok && json.success && json.data) {
          // Backend: { success, data: { access_token, token, user, ... } }
          const token = json.data.access_token || json.data.token;
          const liveUser = mapBackendUser(json.data.user);

          // Store JWT for all subsequent API requests.
          localStorage.setItem(LIVE_TOKEN_KEY, token);

          // Store real user in a live-only key (never touches mock keys).
          localStorage.setItem(LIVE_USER_KEY, JSON.stringify(liveUser));

          // Ensure stale mock session keys cannot bleed into live mode.
          localStorage.removeItem("decisionos_auth_user");

          setUser(liveUser);
          return { success: true };
        }

        return {
          success: false,
          error:
            json?.detail?.message ||
            json?.detail ||
            json?.error?.message ||
            "Authentication failed. Invalid email or password.",
        };
      }

      // ── MOCK LOGIN ────────────────────────────────────────────────────────
      const res = await mockAuthService.login(email, password);

      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }

      return { success: false, error: res.error };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to reach authentication service.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // ── Signup ─────────────────────────────────────────────────────────────────
  const signup = async (
    data: SignupRequestData
  ): Promise<{ success: boolean; error?: string }> => {
    // ── LIVE SIGNUP ───────────────────────────────────────────────────────
    if (!isMockMode()) {
      try {
        const baseUrl = getApiBaseUrl();

        const res = await fetch(`${baseUrl}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.fullName.trim(),
            email: data.email.trim().toLowerCase(),
            password: data.password,
            organization_name: data.organization.trim(),
          }),
        });

        const json = await res.json();

        if (res.ok && json.success) {
          return { success: true };
        }

        return {
          success: false,
          error:
            json?.detail?.message ||
            json?.detail ||
            json?.error?.message ||
            "Registration failed.",
        };
      } catch (err: any) {
        return {
          success: false,
          error: err?.message || "Failed to submit enterprise registration.",
        };
      }
    }

    // ── MOCK SIGNUP ───────────────────────────────────────────────────────
    return await mockAuthService.signup(data);
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async (): Promise<void> => {
    setIsLoading(true);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(EXPLICIT_LOGOUT_KEY, "true");
        localStorage.removeItem(LIVE_TOKEN_KEY);
        localStorage.removeItem(LIVE_USER_KEY);
      }

      // In mock mode, also clear the mock session.
      if (isMockMode()) {
        await mockAuthService.logout();
      }

      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ── updateProfile ────────────────────────────────────────────────────────
  const updateProfile = async (
    data: Partial<User>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!isMockMode()) {
        const token = localStorage.getItem(LIVE_TOKEN_KEY);
        if (!token) {
          return { success: false, error: "Not authenticated" };
        }
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/auth/me`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: data.firstName,
            lastName: data.lastName,
            fullName: data.fullName,
            title: data.title,
            department: data.department,
          }),
        });

        const json = await res.json();
        if (res.ok && json.success && json.data) {
          const updatedUser = mapBackendUser(json.data);
          localStorage.setItem(LIVE_USER_KEY, JSON.stringify(updatedUser));
          setUser(updatedUser);
          return { success: true };
        }

        return {
          success: false,
          error:
            json?.detail?.message ||
            json?.detail ||
            json?.error?.message ||
            "Failed to update profile.",
        };
      }

      // Mock mode
      if (user) {
        const updated: User = {
          ...user,
          ...data,
          fullName: data.fullName || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : user.fullName),
        };
        mockAuthService.setStoredUser(updated);
        setUser(updated);
        return { success: true };
      }

      return { success: false, error: "No user logged in." };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || "Failed to update profile.",
      };
    }
  };

  // ── loginAsDefault (mock-only demo shortcut) ───────────────────────────────
  const loginAsDefault = (): void => {
    // No-op in live mode — never inject a mock user into a live session.
    if (!isMockMode()) return;

    if (typeof window !== "undefined") {
      localStorage.removeItem(EXPLICIT_LOGOUT_KEY);
    }

    mockAuthService.setStoredUser(MOCK_USER);
    setUser(MOCK_USER);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        loginAsDefault,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

