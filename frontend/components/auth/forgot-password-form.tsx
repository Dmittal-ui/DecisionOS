"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, RotateCcw, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);

  // Step 1 state
  const [email, setEmail] = React.useState("alexandra.chen@decisionos.corp");
  const [emailError, setEmailError] = React.useState("");

  // Step 2 state (OTP)
  const [otp, setOtp] = React.useState(["8", "4", "2", "1", "9", "0"]);
  const [otpError, setOtpError] = React.useState("");
  const [resendCountdown, setResendCountdown] = React.useState(45);

  // Step 3 state (New Password)
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");

  const [isLoading, setIsLoading] = React.useState(false);

  // Countdown timer for OTP
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, resendCountdown]);

  // Step 1: Send Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(email.trim())) {
      setEmailError("Please enter a valid corporate email address");
      return;
    }
    setEmailError("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      setResendCountdown(45);
    }, 700);
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setOtpError("Please enter the complete 6-digit verification code");
      return;
    }
    setOtpError("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
    }, 600);
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (resendCountdown > 0) return;
    setResendCountdown(45);
    setOtpError("");
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    setPasswordError("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setStep(4);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {step === 1 && "Reset Password"}
            {step === 2 && "Enter Verification Code"}
            {step === 3 && "Set New Password"}
            {step === 4 && "Password Reset Complete"}
          </h1>
          <Badge variant="outline" className="text-[10px] font-mono">
            STEP {step} OF 4
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {step === 1 && "Enter your verified corporate email to initiate credential reset."}
          {step === 2 && `We sent a 6-digit temporary code to ${email}.`}
          {step === 3 && "Create a new strong password conforming to enterprise security."}
          {step === 4 && "Your security credentials have been successfully updated."}
        </p>
      </div>

      <Card className="border-border/80 shadow-lg">
        <CardContent className="p-6 space-y-5">
          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Corporate Email
                </label>
                <Input
                  type="email"
                  placeholder="name@enterprise.corp"
                  icon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className={emailError ? "border-rose-500" : ""}
                  disabled={isLoading}
                />
                {emailError && <p className="text-[11px] text-rose-500">{emailError}</p>}
              </div>

              <Button
                type="submit"
                className="w-full gap-2 text-xs font-semibold h-10"
                isLoading={isLoading}
                loadingText="Dispatching security code..."
              >
                <span>Send Verification Code</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          {/* STEP 2: 6-Digit OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  6-Digit Verification Code
                </label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      className="w-11 h-12 text-center text-lg font-mono font-bold rounded-lg border border-input bg-background focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                      disabled={isLoading}
                    />
                  ))}
                </div>
                {otpError && <p className="text-[11px] text-rose-500">{otpError}</p>}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>Didn&apos;t receive code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0}
                  className={`font-semibold ${
                    resendCountdown > 0 ? "text-muted-foreground opacity-60" : "text-primary hover:underline"
                  }`}
                >
                  {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : "Resend Code"}
                </button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="flex-1 gap-2 text-xs font-semibold h-9"
                  isLoading={isLoading}
                  loadingText="Verifying security code..."
                >
                  <span>Verify Code</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: Set New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  New Password
                </label>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  icon={<Lock className="h-4 w-4" />}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError("");
                  }}
                  className={passwordError ? "border-rose-500" : ""}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  placeholder="Repeat new password"
                  icon={<Lock className="h-4 w-4" />}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError("");
                  }}
                  className={passwordError ? "border-rose-500" : ""}
                  disabled={isLoading}
                />
                {passwordError && <p className="text-[11px] text-rose-500">{passwordError}</p>}
              </div>

              <Button
                type="submit"
                className="w-full gap-2 text-xs font-semibold h-10"
                isLoading={isLoading}
                loadingText="Updating credentials..."
              >
                <span>Reset Password</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          {/* STEP 4: Success Confirmation */}
          {step === 4 && (
            <div className="text-center space-y-5 py-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">
                  Password Updated
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Your new enterprise password is active. You can now sign in to your DecisionOS workspace.
                </p>
              </div>

              <Button className="w-full gap-2 text-xs font-semibold h-10" asChild>
                <Link href="/login">
                  <span>Return to Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {step !== 4 && (
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      )}
    </div>
  );
}
