"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, AlertCircle, Key, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";
import { isMockMode } from "@/lib/repositories";
import { SSODialog } from "./sso-dialog";

export function LoginForm() {
  const router = useRouter();
  const { login, loginAsDefault } = useAuth();

  const [email, setEmail] = React.useState(
    () => (isMockMode() ? "alexandra.chen@decisionos.corp" : "")
  );
  const [password, setPassword] = React.useState(
    () => (isMockMode() ? "••••••••••••" : "")
  );
  const [rememberMe, setRememberMe] = React.useState(true);

  const [errors, setErrors] = React.useState<{ email?: string; password?: string }>({});
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [ssoDialogOpen, setSsoDialogOpen] = React.useState(false);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errs.email = "Corporate email is required";
    } else if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(email.trim())) {
      errs.email = "Please enter a valid work email address";
    }

    if (!password) {
      errs.password = "Password is required";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        router.push("/dashboard");
      } else {
        setAuthError(res.error || "Unable to sign in. The email or password provided could not be verified.");
      }
    } catch {
      setAuthError("An unexpected error occurred. Please verify network connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("alexandra.chen@decisionos.corp");
    setPassword("EnterpriseAdmin2026!");
    setErrors({});
    setAuthError(null);
  };

  const fillErrorScenario = () => {
    setEmail("alexandra.chen@decisionos.corp");
    setPassword("error");
    setErrors({});
    setAuthError(null);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Sign In
        </h1>
        <p className="text-xs text-muted-foreground">
          Enter your corporate credentials or authenticate with Enterprise SSO.
        </p>
      </div>

      {/* Auth Card */}
      <Card className="border-border/80 shadow-lg">
        <CardContent className="p-6 space-y-5">
          {/* Error Banner */}
          {authError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="space-y-1 flex-1">
                <p className="font-semibold">Unable to sign in</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{authError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Work Email</span>
                <span className="text-[10px] text-muted-foreground">Corporate domain</span>
              </label>
              <Input
                type="email"
                placeholder="name@enterprise.corp"
                icon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={errors.email ? "border-rose-500" : ""}
                autoComplete="email"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Password</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••••••"
                icon={<Lock className="h-4 w-4" />}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={errors.password ? "border-rose-500" : ""}
                autoComplete="current-password"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-[11px] text-rose-500 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span className="text-muted-foreground">Remember this browser for 30 days</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full gap-2 text-xs font-semibold h-10 shadow-sm"
              isLoading={isLoading}
              loadingText="Authenticating credentials..."
            >
              <span>Sign In to DecisionOS</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-border/80 w-full" />
            <span className="bg-card px-3 text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
              Or
            </span>
          </div>

          {/* Enterprise SSO Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setSsoDialogOpen(true)}
            className="w-full gap-2 text-xs font-semibold h-10 border-border/80"
          >
            <Key className="h-4 w-4 text-primary" />
            <span>Continue with Enterprise SSO</span>
          </Button>

          {/* Reviewer Demo Quick-Fill Helper (Mock Mode Only) */}
          {isMockMode() && (
            <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Demo Testing:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="text-primary hover:underline font-medium"
                >
                  Valid User
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={fillErrorScenario}
                  className="text-muted-foreground hover:text-rose-500 font-medium"
                >
                  Trigger Error
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signup Link */}
      <div className="text-center text-xs text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline font-semibold">
          Request enterprise access
        </Link>
      </div>

      {/* SSO Dialog */}
      <SSODialog open={ssoDialogOpen} onOpenChange={setSsoDialogOpen} />
    </div>
  );
}
