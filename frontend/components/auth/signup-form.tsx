"use client";

import * as React from "react";
import Link from "next/link";
import { User, Mail, Building2, Briefcase, Lock, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth/auth-context";

export function SignupForm() {
  const { signup } = useAuth();

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [organization, setOrganization] = React.useState("");
  const [jobTitle, setJobTitle] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [agreeTerms, setAgreeTerms] = React.useState(false);

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Password rules
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumberOrSpecial;

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) errs.fullName = "Full name is required";
    if (!email.trim()) {
      errs.email = "Corporate work email is required";
    } else if (!/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(email.trim())) {
      errs.email = "Please enter a valid work email address";
    }
    if (!organization.trim()) errs.organization = "Organization name is required";
    if (!jobTitle.trim()) errs.jobTitle = "Job title is required";
    if (!password) {
      errs.password = "Password is required";
    } else if (!isPasswordValid) {
      errs.password = "Password does not satisfy enterprise security policy";
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    if (!agreeTerms) {
      errs.agreeTerms = "You must acknowledge the enterprise data & governance terms";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await signup({
        fullName,
        email,
        organization,
        jobTitle,
        password,
      });

      if (res.success) {
        setIsSuccess(true);
      } else {
        setServerError(res.error || "Unable to submit request. Please verify details.");
      }
    } catch {
      setServerError("An error occurred while submitting your workspace request.");
    } finally {
      setIsLoading(false);
    }
  };

  // Success Confirmation View
  if (isSuccess) {
    return (
      <Card className="border-border/80 shadow-xl overflow-hidden">
        <CardContent className="p-8 text-center space-y-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <Badge variant="positive" className="text-xs px-2 py-0.5">
              REQUEST SUBMITTED
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Access Request Submitted
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Your enterprise workspace request for <strong className="text-foreground">{organization}</strong> has been routed to your IT security administrator for domain verification.
            </p>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-4 text-left space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account:</span>
              <span className="font-semibold text-foreground">{fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Work Email:</span>
              <span className="font-mono text-foreground">{email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cluster SLA:</span>
              <span className="text-emerald-500 font-medium">Within 2 business hours</span>
            </div>
          </div>

          <Button className="w-full gap-2 text-xs font-semibold h-10" asChild>
            <Link href="/login">
              <span>Return to Sign In</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Request Workspace
          </h1>
          <Badge variant="enterprise" className="text-[10px]">ENTERPRISE</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Join or provision an authorized DecisionOS decision intelligence cluster.
        </p>
      </div>

      <Card className="border-border/80 shadow-lg">
        <CardContent className="p-6 space-y-5">
          {serverError && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="space-y-1 flex-1">
                <p className="font-semibold">Submission Failed</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">{serverError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Full Name</label>
              <Input
                placeholder="Alexandra Chen"
                icon={<User className="h-4 w-4" />}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
                }}
                className={errors.fullName ? "border-rose-500 text-xs" : "text-xs"}
                disabled={isLoading}
              />
              {errors.fullName && <p className="text-[11px] text-rose-500">{errors.fullName}</p>}
            </div>

            {/* Work Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Corporate Email</label>
              <Input
                type="email"
                placeholder="name@enterprise.corp"
                icon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                }}
                className={errors.email ? "border-rose-500 text-xs" : "text-xs"}
                disabled={isLoading}
              />
              {errors.email && <p className="text-[11px] text-rose-500">{errors.email}</p>}
            </div>

            {/* Organization & Job Title in 2 Cols */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Organization</label>
                <Input
                  placeholder="Apex Global Inc."
                  icon={<Building2 className="h-4 w-4" />}
                  value={organization}
                  onChange={(e) => {
                    setOrganization(e.target.value);
                    if (errors.organization) setErrors((prev) => ({ ...prev, organization: "" }));
                  }}
                  className={errors.organization ? "border-rose-500 text-xs" : "text-xs"}
                  disabled={isLoading}
                />
                {errors.organization && <p className="text-[11px] text-rose-500">{errors.organization}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Job Title</label>
                <Input
                  placeholder="CSOO / VP Ops"
                  icon={<Briefcase className="h-4 w-4" />}
                  value={jobTitle}
                  onChange={(e) => {
                    setJobTitle(e.target.value);
                    if (errors.jobTitle) setErrors((prev) => ({ ...prev, jobTitle: "" }));
                  }}
                  className={errors.jobTitle ? "border-rose-500 text-xs" : "text-xs"}
                  disabled={isLoading}
                />
                {errors.jobTitle && <p className="text-[11px] text-rose-500">{errors.jobTitle}</p>}
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Password</label>
              <Input
                type="password"
                placeholder="Create secure password"
                icon={<Lock className="h-4 w-4" />}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                }}
                className={errors.password ? "border-rose-500 text-xs" : "text-xs"}
                disabled={isLoading}
              />
              {/* Password checklist */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[10px] text-muted-foreground">
                <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-500 font-semibold" : ""}`}>
                  • 8+ characters
                </span>
                <span className={`flex items-center gap-1 ${hasLetter ? "text-emerald-500 font-semibold" : ""}`}>
                  • Letters
                </span>
                <span className={`flex items-center gap-1 ${hasNumberOrSpecial ? "text-emerald-500 font-semibold" : ""}`}>
                  • Number/Symbol
                </span>
              </div>
              {errors.password && <p className="text-[11px] text-rose-500">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Confirm Password</label>
              <Input
                type="password"
                placeholder="Repeat password"
                icon={<Lock className="h-4 w-4" />}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                className={errors.confirmPassword ? "border-rose-500 text-xs" : "text-xs"}
                disabled={isLoading}
              />
              {errors.confirmPassword && <p className="text-[11px] text-rose-500">{errors.confirmPassword}</p>}
            </div>

            {/* Terms Acknowledgement */}
            <div className="space-y-1 pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none text-xs">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (errors.agreeTerms) setErrors((prev) => ({ ...prev, agreeTerms: "" }));
                  }}
                  className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 mt-0.5"
                  disabled={isLoading}
                />
                <span className="text-muted-foreground text-[11px] leading-snug">
                  I agree to the Enterprise Master Subscription Agreement and DecisionOS Governance Policy.
                </span>
              </label>
              {errors.agreeTerms && <p className="text-[11px] text-rose-500">{errors.agreeTerms}</p>}
            </div>

            <Button
              type="submit"
              className="w-full gap-2 text-xs font-semibold h-10 mt-2 shadow-sm"
              isLoading={isLoading}
              loadingText="Submitting workspace request..."
            >
              <span>Submit Access Request</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground">
        Already have an enterprise account?{" "}
        <Link href="/login" className="text-primary hover:underline font-semibold">
          Sign In
        </Link>
      </div>
    </div>
  );
}
