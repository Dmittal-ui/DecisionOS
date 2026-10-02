import {
  LayoutDashboard,
  Sparkles,
  Search,
  RotateCcw,
  Sliders,
  Cpu,
  GitPullRequest,
  Dna,
  UserCheck,
  Building2,
} from "lucide-react";

export const APP_CONFIG = {
  name: "DecisionOS",
  tagline: "Enterprise Autonomous Decision Intelligence",
  version: "1.0.0-alpha",
  company: "DecisionOS Systems",
};

export interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string;
  description: string;
  category: "core" | "intelligence" | "governance";
}

export const MAIN_NAVIGATION: NavItem[] = [
  {
    title: "Business & Data",
    href: "/business",
    icon: Building2,
    description: "Set up your business workspace, upload datasets, normalize data, and build your Digital Twin.",
    category: "core",
  },
  {
    title: "Executive Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "High-level decision velocity, value unlocked, and strategic metrics.",
    category: "core",
  },
  {
    title: "Opportunity Radar",
    href: "/opportunities",
    icon: Sparkles,
    description: "Algorithmic discovery of margin leaks, growth vectors, and optimizations.",
    category: "core",
  },
  {
    title: "Deep Investigation",
    href: "/investigation",
    icon: Search,
    description: "Root-cause anomaly tracing, hypothesis testing, and causal graphs.",
    category: "intelligence",
  },
  {
    title: "Decision Replay",
    href: "/replay",
    icon: RotateCcw,
    description: "Counterfactual playback of historical decisions to reveal missed alpha.",
    category: "intelligence",
  },
  {
    title: "Scenario Simulation",
    href: "/scenario",
    icon: Sliders,
    description: "Multi-variable Monte Carlo projections and stress-test sandboxes.",
    category: "intelligence",
  },
  {
    title: "Multi-Objective Optimizer",
    href: "/optimizer",
    icon: Cpu,
    description: "Constraint-based Pareto optimal allocation engine.",
    category: "intelligence",
  },
  {
    title: "Decision Registry",
    href: "/decisions",
    icon: GitPullRequest,
    description: "Governance, stakeholder sign-offs, and automated execution trails.",
    category: "governance",
  },
  {
    title: "Decision DNA",
    href: "/decision-dna",
    icon: Dna,
    description: "Organizational cognitive bias detection, behavioral traits, and audit score.",
    category: "governance",
  },
  {
    title: "Profile & Settings",
    href: "/profile",
    icon: UserCheck,
    description: "User preferences, security, workspace tokens, and notifications.",
    category: "governance",
  },
];
