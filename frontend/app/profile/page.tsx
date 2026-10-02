"use client";

import * as React from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { getBusinessRepository } from "@/lib/repositories";
import type {
  BusinessWorkspace,
  DatasetHistorySummary,
  DatasetHistoryDetail,
  DigitalTwin,
} from "@/types/business";
import { cn } from "@/lib/utils";
import {
  Shield,
  Key,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  History,
  RotateCcw,
  Database,
  Eye,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  Info,
  Calendar,
  BarChart3,
  ExternalLink,
} from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading, updateProfile } = useAuth();
  const repo = React.useMemo(() => getBusinessRepository(), []);

  // Form State
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [department, setDepartment] = React.useState("");

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  // Business and History Data
  const [business, setBusiness] = React.useState<BusinessWorkspace | null>(null);
  const [historyList, setHistoryList] = React.useState<DatasetHistorySummary[]>([]);
  const [activeTwin, setActiveTwin] = React.useState<DigitalTwin | null>(null);
  const [dataLoading, setDataLoading] = React.useState(false);

  // Reset Confirmation State
  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const [resetBusy, setResetBusy] = React.useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = React.useState<string | null>(null);
  const [resetErrorMsg, setResetErrorMsg] = React.useState<string | null>(null);

  // History Detail Modal State
  const [selectedDatasetId, setSelectedDatasetId] = React.useState<string | null>(null);
  const [historyDetail, setHistoryDetail] = React.useState<DatasetHistoryDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  // Sync profile state when user changes
  React.useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setTitle(user.title || "");
      setDepartment(user.department || "");
    }
  }, [user]);

  // Load Business workspace, digital twin and dataset history
  const loadBusinessAndHistory = React.useCallback(async () => {
    setDataLoading(true);
    try {
      const [bizRes, histRes] = await Promise.all([
        repo.getBusiness().catch(() => null),
        repo.listHistory().catch(() => []),
      ]);
      setBusiness(bizRes);
      setHistoryList(histRes);

      if (bizRes) {
        try {
          const tw = await repo.getDigitalTwin();
          setActiveTwin(tw);
        } catch {
          setActiveTwin(null);
        }
      }
    } catch {
      // Non-critical fetch error
    } finally {
      setDataLoading(false);
    }
  }, [repo]);

  React.useEffect(() => {
    if (user) {
      loadBusinessAndHistory();
    }
  }, [user, loadBusinessAndHistory]);

  // Load detailed historical dataset snapshot
  const handleOpenHistoryDetail = async (datasetId: string) => {
    setSelectedDatasetId(datasetId);
    setDetailLoading(true);
    setDetailError(null);
    setHistoryDetail(null);
    try {
      const detail = await repo.getHistoryDetail(datasetId);
      setHistoryDetail(detail);
    } catch (err: any) {
      setDetailError(err?.message || "Failed to load historical snapshot details.");
    } finally {
      setDetailLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <PageContainer maxWidth="full">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading profile information...</p>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <PageContainer maxWidth="full">
          <Card className="max-w-md mx-auto my-12 text-center p-6 space-y-4">
            <CardTitle className="text-lg">Authentication Required</CardTitle>
            <CardDescription className="text-sm">
              Please sign in to view and manage your profile and workspace settings.
            </CardDescription>
            <Button asChild className="w-full">
              <Link href="/login">Sign In</Link>
            </Button>
          </Card>
        </PageContainer>
      </AppLayout>
    );
  }

  const initials = (user.fullName || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    if (!firstName.trim() && !lastName.trim()) {
      setSaveError("First name or last name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        title: title.trim(),
        department: department.trim(),
      });

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(res.error || "Failed to save profile changes.");
      }
    } catch {
      setSaveError("An unexpected error occurred while saving profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCurrentData = async () => {
    setResetBusy(true);
    setResetErrorMsg(null);
    setResetSuccessMsg(null);
    try {
      const res = await repo.resetCurrentData();
      setShowResetDialog(false);
      setResetSuccessMsg(res.message || "Active business dataset and operational models reset successfully.");
      setActiveTwin(null);
      await loadBusinessAndHistory();
    } catch (err: any) {
      setResetErrorMsg(err?.message || "Failed to reset current business data.");
    } finally {
      setResetBusy(false);
    }
  };

  const activeDataset = historyList.find((h) => h.status === "ACTIVE" || h.isCurrent);

  return (
    <AppLayout>
      <PageContainer maxWidth="full">
        <PageHeader
          title="Account & Business Lineage"
          description="Manage enterprise identity, corporate workspaces, and inspect immutable historical analysis snapshots across dataset versions."
          badge="Enterprise Tier"
          badgeVariant="enterprise"
        >
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{isSaving ? "Saving..." : saveSuccess ? "Saved" : "Save Preferences"}</span>
          </Button>
        </PageHeader>

        {saveSuccess && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center gap-3 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Profile and preferences updated successfully.</span>
          </div>
        )}

        {saveError && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-center gap-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {resetSuccessMsg && (
          <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center gap-3 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{resetSuccessMsg}</span>
          </div>
        )}

        {resetErrorMsg && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-center gap-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{resetErrorMsg}</span>
          </div>
        )}

        {/* ─── Profile Navigation Tabs ──────────────────────────────────────── */}
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid grid-cols-3 max-w-md">
            <TabsTrigger value="account" className="gap-2">
              <Shield className="h-4 w-4" />
              <span>Account</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span>Current Business</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: ACCOUNT & IDENTITY
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="account">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* User Identity Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">User Identity</CardTitle>
                  <CardDescription className="text-xs">
                    Active corporate credentials and governance role.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center space-y-4 pt-2">
                  <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                    <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">{user.fullName || "Enterprise User"}</h3>
                    <p className="text-xs text-muted-foreground">{user.title || "Not set"}</p>
                    <div className="pt-2">
                      <Badge variant="enterprise" className="capitalize">
                        {user.role ? user.role.replace(/_/g, " ") : "Executive"}
                      </Badge>
                    </div>
                  </div>

                  <div className="w-full border-t border-border pt-4 text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Organization:</span>
                      <span className="font-medium text-foreground">{user.organizationName || "Enterprise"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-medium text-foreground">{user.department || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium text-emerald-500 uppercase">{user.status || "active"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Settings and Security */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Account Details</CardTitle>
                    <CardDescription className="text-xs">
                      Update personal profile attributes and corporate email.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">First Name</label>
                        <Input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="First Name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Last Name</label>
                        <Input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Last Name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Job Title</label>
                        <Input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Chief Operating Officer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Department</label>
                        <Input
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g. Supply Chain Operations"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Corporate Email</label>
                      <Input value={user.email} disabled className="bg-muted/40" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Security & API Keys</CardTitle>
                    <CardDescription className="text-xs">
                      Autonomous agents invocation tokens and SAML 2.0 Single Sign-On credentials.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-emerald-500" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">SAML 2.0 Single Sign-On</p>
                          <p className="text-[11px] text-muted-foreground">Enforced by corporate identity provider (Okta/Entra ID)</p>
                        </div>
                      </div>
                      <Badge variant="positive">ENFORCED</Badge>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 p-4">
                      <div className="flex items-center gap-3">
                        <Key className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-xs font-semibold text-foreground">Decision Engine API Token</p>
                          <p className="text-[11px] font-mono text-muted-foreground">dec_live_••••••••••••••••</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        Rotate Key
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: CURRENT BUSINESS & ACTIVE DATA
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="business" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Workspace Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">Workspace Configuration</CardTitle>
                      <CardDescription className="text-xs">
                        Active tenant and business operational profile.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs h-7" asChild>
                      <Link href="/business">Manage Workspace</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Business Name</span>
                    <span className="font-medium text-foreground">{business?.businessName || user.organizationName || "Not configured"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Industry</span>
                    <span className="font-medium text-foreground">{business?.industry || "E-Commerce / Retail"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/50">
                    <span className="text-muted-foreground">Currency</span>
                    <span className="font-medium font-mono text-foreground">{business?.currency || "INR"}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted-foreground">Timezone</span>
                    <span className="font-medium text-foreground">{business?.timezone || "Asia/Kolkata"}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Active Dataset Status & Reset Action */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Active Dataset Status</CardTitle>
                  <CardDescription className="text-xs">
                    Current business dataset feeding the Digital Twin and Decision models.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeDataset ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-primary" />
                            <span className="font-bold text-foreground">{activeDataset.filename}</span>
                          </div>
                          <Badge variant="positive" className="text-[10px]">ACTIVE</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground font-mono pt-1">
                          <div>Version: v{activeDataset.version}</div>
                          <div>Quality: {activeDataset.dataQualityScore?.toFixed(1) ?? "100.0"}%</div>
                          <div>Rows: {activeDataset.validRows?.toLocaleString() ?? activeDataset.totalRows?.toLocaleString()}</div>
                          <div>Uploaded: {new Date(activeDataset.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-[11px] text-muted-foreground">
                          Want to start a new analysis with new data?
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-rose-500 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400"
                          onClick={() => setShowResetDialog(true)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reset Current Data
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 space-y-3 text-muted-foreground">
                      <Database className="h-8 w-8 mx-auto opacity-40" />
                      <p className="text-xs">No active dataset is currently loaded.</p>
                      <Button size="sm" asChild>
                        <Link href="/business">Upload Dataset</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: DATASET HISTORY & RESULTS LINEAGE
          ══════════════════════════════════════════════════════════════════ */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">Historical Datasets & Analysis Snapshots</CardTitle>
                    <CardDescription className="text-xs">
                      Inspect previous dataset uploads and the exact immutable results generated from each version.
                    </CardDescription>
                  </div>
                  <Badge variant="neutral" className="font-mono text-xs">
                    {historyList.length} {historyList.length === 1 ? "Session" : "Sessions"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {dataLoading ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Loading historical analysis records…</span>
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="text-center py-12 space-y-3 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto opacity-40" />
                    <p className="text-xs">No historical datasets found for your organization.</p>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/business">Upload First Dataset</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border/60">
                    {historyList.map((item) => {
                      const isActive = item.status === "ACTIVE" || item.isCurrent;
                      return (
                        <div
                          key={item.datasetId}
                          className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 px-2 rounded-lg transition-colors"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground truncate">
                                {item.filename}
                              </span>
                              <Badge variant={isActive ? "positive" : "neutral"} className="text-[10px]">
                                {isActive ? "ACTIVE" : "ARCHIVED"}
                              </Badge>
                              <span className="text-[10px] font-mono text-muted-foreground">
                                v{item.version}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(item.createdAt).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <span>·</span>
                              <span>{item.validRows?.toLocaleString() ?? item.totalRows?.toLocaleString()} rows</span>
                              <span>·</span>
                              <span>Quality: {item.dataQualityScore?.toFixed(1) ?? "100.0"}%</span>
                              {item.opportunitiesCount > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="text-primary font-medium">{item.opportunitiesCount} Opportunities</span>
                                </>
                              )}
                              {item.decisionsCount > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="text-emerald-500 font-medium">{item.decisionsCount} Decisions</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1.5"
                              onClick={() => handleOpenHistoryDetail(item.datasetId)}
                            >
                              <Eye className="h-3.5 w-3.5 text-primary" />
                              <span>View Analysis</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── Reset Data Confirmation Dialog ─────────────────────────────── */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-500">
                <RotateCcw className="h-5 w-5" />
                Reset Current Business Data
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground pt-1">
                This action archives the active dataset and removes active operational state so you can start a completely fresh analysis.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 space-y-1.5 text-rose-700 dark:text-rose-400">
                <p className="font-semibold text-xs">What will happen:</p>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-muted-foreground">
                  <li>Current active dataset will be archived safely.</li>
                  <li>Active Digital Twin, Opportunity scans, Investigations, Scenarios, and Optimization results will be cleared.</li>
                  <li>Historical dataset records and past analysis snapshots remain preserved under your Profile History.</li>
                  <li><strong className="text-foreground">Your user account and organization will NOT be deleted.</strong></li>
                </ul>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Are you sure you want to reset current active data and start a new analysis?
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetDialog(false)}
                disabled={resetBusy}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={handleResetCurrentData}
                disabled={resetBusy}
              >
                {resetBusy ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Resetting Data…
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Confirm Reset
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Historical Dataset Detail View Dialog ─────────────────────────── */}
        <Dialog
          open={Boolean(selectedDatasetId)}
          onOpenChange={(open) => {
            if (!open) setSelectedDatasetId(null);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <div>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Database className="h-4 w-4 text-primary" />
                    <span>Dataset Analysis Snapshot</span>
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground pt-1">
                    Immutable read-only results generated specifically from this dataset version.
                  </DialogDescription>
                </div>
                {historyDetail && (
                  <Badge
                    variant={historyDetail.isCurrent ? "positive" : "neutral"}
                    className="text-xs uppercase"
                  >
                    {historyDetail.isCurrent ? "Active Dataset" : "Archived Lineage"}
                  </Badge>
                )}
              </div>
            </DialogHeader>

            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground">Loading historical snapshot…</p>
              </div>
            ) : detailError ? (
              <div className="p-4 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{detailError}</span>
              </div>
            ) : historyDetail ? (
              <div className="space-y-5 py-2">
                {/* Disclosures & Lineage Notice */}
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400">
                    <Info className="h-3.5 w-3.5" />
                    <span>Data Governance & Lineage Disclosure</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {historyDetail.disclosures?.lineageNotice || "Historical results are strictly associated with this dataset version and are never recalculated using later datasets."}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[10px] text-muted-foreground font-mono">
                    <div>• <strong>Observed:</strong> Data-derived from raw orders</div>
                    <div>• <strong>Assumptions:</strong> Calibrated domain baseline</div>
                    <div>• <strong>Simulated:</strong> Multi-variable optimizer runs</div>
                  </div>
                </div>

                {/* Dataset Overview Bar */}
                <div className="rounded-lg border border-border/70 bg-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">Filename</span>
                    <p className="font-bold text-foreground truncate">{historyDetail.dataset.filename}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">Dataset ID</span>
                    <p className="font-mono text-foreground text-[11px] truncate">{historyDetail.dataset.datasetId}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">Rows / Quality</span>
                    <p className="font-bold text-foreground">
                      {historyDetail.dataset.validRows?.toLocaleString()} rows ({historyDetail.dataset.dataQualityScore?.toFixed(1)}%)
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-muted-foreground">Uploaded Date</span>
                    <p className="font-bold text-foreground">
                      {new Date(historyDetail.dataset.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Digital Twin Metrics Snapshot */}
                {historyDetail.digitalTwin?.metrics ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5 text-primary" />
                        Digital Twin Metrics Snapshot
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Quality Score: {historyDetail.digitalTwin.dataQualityScore?.toFixed(1)}%
                      </span>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(historyDetail.digitalTwin.metrics).map(([k, m]: [string, any]) => (
                        <div key={k} className="rounded-lg border border-border/60 bg-muted/10 p-2.5 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">{m.name}</span>
                            <Badge variant={m.available ? "positive" : "neutral"} className="text-[9px] px-1 py-0">
                              {m.available ? "Observed" : "N/A"}
                            </Badge>
                          </div>
                          <p className="text-sm font-bold text-foreground">{m.formattedValue || "N/A"}</p>
                          {m.available && m.confidence !== undefined && (
                            <p className="text-[10px] text-muted-foreground font-mono">Confidence: {m.confidence}%</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border border-border/50 text-center text-xs text-muted-foreground">
                    No Digital Twin was generated for this historical dataset.
                  </div>
                )}

                {/* Opportunities Detected in Snapshot */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Opportunities Detected ({historyDetail.opportunities.length})
                  </span>
                  {historyDetail.opportunities.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic pl-1">No opportunities recorded in this snapshot.</p>
                  ) : (
                    <div className="space-y-2">
                      {historyDetail.opportunities.map((opp: any) => (
                        <div
                          key={opp.id || opp.opportunity_id}
                          className="rounded-lg border border-border/60 bg-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{opp.title}</span>
                              <Badge variant="enterprise" className="text-[10px]">{opp.category}</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{opp.description}</p>
                          </div>
                          <div className="text-right shrink-0 font-mono">
                            <span className="text-emerald-500 font-bold">
                              +{opp.financialImpact?.annualizedProfitLiftFormatted || opp.annualizedProfitLiftFormatted || "₹0"}
                            </span>
                            <span className="text-[10px] text-muted-foreground block">Impact</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Decisions Registered in Snapshot */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Decisions & Governance Log ({historyDetail.decisions.length})
                  </span>
                  {historyDetail.decisions.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic pl-1">No decisions registered under this dataset lineage.</p>
                  ) : (
                    <div className="space-y-2">
                      {historyDetail.decisions.map((dec: any) => (
                        <div
                          key={dec.id || dec.decision_id}
                          className="rounded-lg border border-border/60 bg-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{dec.title}</span>
                              <Badge variant="positive" className="text-[10px]">{dec.status}</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{dec.rationale}</p>
                          </div>
                          <div className="text-right shrink-0 text-[11px] text-muted-foreground font-mono">
                            {new Date(dec.createdAt || dec.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDatasetId(null)}
              >
                Close Snapshot
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </AppLayout>
  );
}
