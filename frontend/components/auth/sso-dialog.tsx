"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck, ArrowRight, Lock, Key } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";

interface SSODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SSODialog({ open, onOpenChange }: SSODialogProps) {
  const [domain, setDomain] = React.useState("apexenterprise.corp");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [domainError, setDomainError] = React.useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleSSORedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !domain.includes(".")) {
      setDomainError("Please enter a valid corporate identity domain (e.g. enterprise.com)");
      return;
    }
    setDomainError("");
    setIsSubmitting(true);

    // Mock SSO redirect flow
    setTimeout(async () => {
      await login(`sso.user@${domain}`, "sso_authorized_session");
      setIsSubmitting(false);
      onOpenChange(false);
      router.push("/dashboard");
    }, 900);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Key className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold">Enterprise SSO Authentication</DialogTitle>
            </div>
            <Badge variant="enterprise" className="text-[10px]">SAML 2.0 / OIDC</Badge>
          </div>
          <DialogDescription className="text-xs pt-1">
            Authenticate via your organization&apos;s configured identity provider (Okta, Microsoft Entra ID, Ping Identity, Google Workspace).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSSORedirect} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Corporate Email Domain
            </label>
            <Input
              type="text"
              placeholder="company.com"
              icon={<Building2 className="h-4 w-4" />}
              value={domain}
              onChange={(e) => {
                setDomain(e.target.value);
                setDomainError("");
              }}
              className="text-xs"
            />
            {domainError && (
              <p className="text-[11px] text-rose-500 font-medium">{domainError}</p>
            )}
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-foreground font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Identity Federation Ready</span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              SSO is available when your organization&apos;s identity provider is connected. You will be redirected to complete multi-factor authentication.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              loadingText="Redirecting to IdP..."
              className="gap-1.5"
            >
              <span>Continue with SSO</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
