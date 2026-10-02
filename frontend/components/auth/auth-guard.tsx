"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, loginAsDefault } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Verifying Session Security</p>
          <p className="text-xs text-muted-foreground font-mono">DecisionOS Authorization Gate</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center space-y-4 max-w-md mx-auto">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Lock className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">Authentication Required</h2>
          <p className="text-xs text-muted-foreground">
            You must be signed in to access this enterprise workspace module.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full pt-2">
          <Button variant="outline" size="sm" onClick={loginAsDefault} className="flex-1 text-xs">
            Sign In with Demo Admin
          </Button>
          <Button size="sm" asChild className="flex-1 text-xs">
            <Link href={`/login?returnUrl=${encodeURIComponent(pathname)}`}>
              Go to Sign In
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
