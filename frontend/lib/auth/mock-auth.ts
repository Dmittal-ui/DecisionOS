import { User } from "@/types/user";
import { MOCK_USER } from "@/lib/mock-data/user.mock";

export const AUTH_STORAGE_KEY = "decisionos_auth_user";
export const AUTH_TOKEN_KEY = "decisionos_auth_token";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SignupRequestData {
  fullName: string;
  email: string;
  organization: string;
  jobTitle: string;
  password?: string;
}

/**
 * Frontend Mock Auth Service
 * Simulates authentication delays and state changes without real backend APIs.
 */
export const mockAuthService = {
  getStoredUser(): User | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore JSON parse errors
    }
    return null;
  },

  setStoredUser(user: User | null): void {
    if (typeof window === "undefined") return;
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem(AUTH_TOKEN_KEY, "mock_token_" + Date.now());
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  },

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 650));

    // Simple mock validation rule:
    // Any valid email format with length > 5 and password length >= 6 succeeds.
    // If password is "error", simulate auth failure.
    if (password === "error" || password === "fail") {
      return {
        success: false,
        error: "The email or password provided could not be verified. Please verify your credentials and try again.",
      };
    }

    // Default mock user with custom email if provided
    const user: User = {
      ...MOCK_USER,
      email: email.trim(),
      fullName: email.split("@")[0].replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase()) || MOCK_USER.fullName,
    };

    mockAuthService.setStoredUser(user);
    return { success: true, user };
  },

  async signup(data: SignupRequestData): Promise<{ success: boolean; error?: string }> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (data.email.includes("error")) {
      return {
        success: false,
        error: "An organization domain conflict was detected. Please contact your IT administrator.",
      };
    }

    return { success: true };
  },

  async logout(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    mockAuthService.setStoredUser(null);
  },
};
