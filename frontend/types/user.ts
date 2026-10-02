export type UserRole = "executive" | "decision_analyst" | "operator" | "auditor" | "admin";

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  defaultCurrency: string;
  defaultTimeframe: "7d" | "30d" | "90d" | "1y";
  notifications: {
    criticalAlerts: boolean;
    weeklyDigest: boolean;
    decisionApproved: boolean;
    dnaDeviations: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  title: string;
  organizationId: string;
  organizationName: string;
  department: string;
  createdAt: string;
  lastLoginAt: string;
  status: "active" | "inactive" | "pending";
  preferences: UserPreferences;
}
