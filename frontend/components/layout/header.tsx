"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserNav } from "@/components/layout/user-nav";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Search,
  SlidersHorizontal,
  Moon,
  Sun,
  ShieldAlert,
  Menu,
} from "lucide-react";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const [isDark, setIsDark] = React.useState(false);

  // Sync theme class on mount (reads from DOM in case layout sets it)
  // and whenever isDark changes.
  React.useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6">
      {/* Mobile Toggle & Search Bar */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-lg">
        {onMobileMenuToggle && (
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <div className="relative w-full max-w-sm hidden sm:block">
          <Input
            placeholder="Search opportunities, decisions, models..."
            icon={<Search className="h-3.5 w-3.5" />}
            className="h-8 text-xs bg-muted/40 focus:bg-background"
          />
        </div>
      </div>

      {/* Header Actions & Context */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Environment Tag */}
        <div className="hidden xl:flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-mono text-muted-foreground">
            PROD / APEX-ENTERPRISE-V4
          </span>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="text-muted-foreground hover:text-foreground"
        >
          {isDark ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Notifications Alert */}
        <Link href="/opportunities">
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative text-muted-foreground hover:text-foreground"
            title="Active Intelligence Alerts"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </Button>
        </Link>

        {/* User Nav */}
        <div className="pl-2 border-l border-border/80">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
