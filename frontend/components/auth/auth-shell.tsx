"use client";

import * as React from "react";
import Link from "next/link";
import { AuthBranding } from "./auth-branding";
import { Activity } from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

interface AuthShellProps {
  children: React.ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-background">
      {/* Left Column: Enterprise Branding (5 cols on lg, 6 cols on xl) */}
      <div className="hidden lg:block lg:col-span-5 xl:col-span-5 h-full">
        <AuthBranding />
      </div>

      {/* Right Column: Form Container (7 cols on lg, 7 cols on xl) */}
      <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between pb-6 mb-4 border-b border-border/60">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">
              {APP_CONFIG.name}
            </span>
          </Link>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">
            Enterprise Auth
          </span>
        </div>

        {/* Center Content Slot */}
        <div className="my-auto max-w-md w-full mx-auto space-y-6">
          {children}
        </div>

        {/* Form Footer */}
        <div className="pt-8 text-center text-xs text-muted-foreground border-t border-border/40 max-w-md w-full mx-auto">
          <p>© {new Date().getFullYear()} DecisionOS Systems Inc. Enterprise Decision Intelligence.</p>
        </div>
      </div>
    </div>
  );
}
