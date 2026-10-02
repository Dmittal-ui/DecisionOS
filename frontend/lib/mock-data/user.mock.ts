import { User } from "@/types/user";

export const MOCK_USER: User = {
  id: "usr_99182a",
  email: "alexandra.chen@decisionos.corp",
  firstName: "Alexandra",
  lastName: "Chen",
  fullName: "Alexandra Chen",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  role: "executive",
  title: "Chief Strategy & Operating Officer",
  organizationId: "org_global_enterprise",
  organizationName: "Apex Global Dynamics Inc.",
  department: "Enterprise Strategy & Operations",
  createdAt: "2025-01-15T08:00:00Z",
  lastLoginAt: "2026-09-29T10:15:00Z",
  status: "active",
  preferences: {
    theme: "dark",
    defaultCurrency: "USD",
    defaultTimeframe: "30d",
    notifications: {
      criticalAlerts: true,
      weeklyDigest: true,
      decisionApproved: true,
      dnaDeviations: true,
    },
  },
};
