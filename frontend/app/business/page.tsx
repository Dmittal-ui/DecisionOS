"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  Upload,
  FileText,
  Cpu,
  Radar,
  CheckCircle2,
  Circle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Loader2,
  ArrowRight,
  Database,
  BarChart3,
  Sparkles,
  XCircle,
  ChevronDown,
  ChevronUp,
  Save,
  Plus,
  RotateCcw,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getBusinessRepository,
  getOpportunityRepository,
} from "@/lib/repositories";
import type {
  BusinessWorkspace,
  UploadedFile,
  DatasetRecord,
  DigitalTwin,
  NormalizationResult,
} from "@/types/business";

// ─── Constants ────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  "E-Commerce",
  "Retail",
  "Manufacturing",
  "Financial Services",
  "Healthcare",
  "SaaS / Technology",
  "Logistics & Supply Chain",
  "Consumer Goods",
  "Real Estate",
  "Media & Entertainment",
  "Education",
  "Other",
];

const CURRENCIES = [
  { code: "INR", label: "INR — Indian Rupee" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "AED", label: "AED — UAE Dirham" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
];

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York (EST)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
  { value: "Europe/London", label: "Europe/London (GMT)" },
  { value: "Europe/Berlin", label: "Europe/Berlin (CET)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
];

const ACCEPTED_TYPES = ".csv,.xlsx,.json";
const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB

// ─── Helper: human-readable file size ─────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
      {children}
    </p>
  );
}

// ─── Inline field row ──────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Readiness step row ────────────────────────────────────────────────────────

function ReadinessRow({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
      )}
      <div className="min-w-0">
        <p className={cn("text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>
          {label}
        </p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

// ─── Toast-style inline alert ──────────────────────────────────────────────────

function Alert({
  variant,
  message,
}: {
  variant: "success" | "error" | "info";
  message: string;
}) {
  const styles = {
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
    error: "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400",
    info: "bg-primary/10 border-primary/30 text-primary",
  };
  const Icon = variant === "success" ? CheckCircle2 : variant === "error" ? XCircle : AlertCircle;
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border p-3 text-xs", styles[variant])}>
      <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BusinessPage() {
  const repo = React.useMemo(() => getBusinessRepository(), []);

  // ── Global page state ────────────────────────────────────────────────────
  const [isPageLoading, setIsPageLoading] = React.useState(true);
  const [pageError, setPageError] = React.useState<string | null>(null);

  // ── Business workspace state ─────────────────────────────────────────────
  const [business, setBusiness] = React.useState<BusinessWorkspace | null>(null);
  const [bizName, setBizName] = React.useState("");
  const [bizIndustry, setBizIndustry] = React.useState("E-Commerce");
  const [bizCurrency, setBizCurrency] = React.useState("INR");
  const [bizTimezone, setBizTimezone] = React.useState("Asia/Kolkata");
  const [bizSaving, setBizSaving] = React.useState(false);
  const [bizAlert, setBizAlert] = React.useState<{ variant: "success" | "error"; msg: string } | null>(null);

  // ── File upload state ────────────────────────────────────────────────────
  const [files, setFiles] = React.useState<UploadedFile[]>([]);
  const [filesLoading, setFilesLoading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadBusy, setUploadBusy] = React.useState(false);
  const [uploadAlert, setUploadAlert] = React.useState<{ variant: "success" | "error"; msg: string } | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // ── Normalization state ──────────────────────────────────────────────────
  const [normalizingId, setNormalizingId] = React.useState<string | null>(null);
  const [normResult, setNormResult] = React.useState<NormalizationResult | null>(null);
  const [normAlert, setNormAlert] = React.useState<{ variant: "success" | "error"; msg: string } | null>(null);

  // ── Digital Twin state ───────────────────────────────────────────────────
  const [twin, setTwin] = React.useState<DigitalTwin | null>(null);
  const [twinLoading, setTwinLoading] = React.useState(false);
  const [twinAlert, setTwinAlert] = React.useState<string | null>(null);
  const [datasets, setDatasets] = React.useState<DatasetRecord[]>([]);

  // ── Reset Current Data State ─────────────────────────────────────────────
  const [showResetDialog, setShowResetDialog] = React.useState(false);
  const [resetBusy, setResetBusy] = React.useState(false);
  const [resetAlert, setResetAlert] = React.useState<{ variant: "success" | "error"; msg: string } | null>(null);

  // ── Radar state ──────────────────────────────────────────────────────────
  const [radarBusy, setRadarBusy] = React.useState(false);
  const [radarAlert, setRadarAlert] = React.useState<{ variant: "success" | "error"; msg: string } | null>(null);
  const [hasRunScan, setHasRunScan] = React.useState(false);

  // ── Collapsible sections ─────────────────────────────────────────────────
  const [openSection, setOpenSection] = React.useState<string>("business");

  // ─── Initial data load ─────────────────────────────────────────────────
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsPageLoading(true);
      setPageError(null);
      try {
        const oppRepo = getOpportunityRepository();
        // Load files, datasets, and opportunities in parallel
        const [filesResult, datasetsResult, oppsResult] = await Promise.all([
          repo.listFiles().catch(() => [] as UploadedFile[]),
          repo.listDatasets().catch(() => [] as DatasetRecord[]),
          oppRepo.getOpportunities().catch(() => []),
        ]);

        let biz: BusinessWorkspace | null = null;
        try {
          biz = await repo.getBusiness();
        } catch {
          // 404 means not created yet — that is expected
        }

        let tw: DigitalTwin | null = null;
        if (datasetsResult.length > 0) {
          try {
            tw = await repo.getDigitalTwin();
          } catch {
            // No twin yet
          }
        }

        if (!cancelled) {
          setBusiness(biz);
          if (biz) {
            setBizName(biz.businessName);
            setBizIndustry(biz.industry);
            setBizCurrency(biz.currency);
            setBizTimezone(biz.timezone);
          }
          setFiles(filesResult);
          setDatasets(datasetsResult);
          setTwin(tw);
          if (Array.isArray(oppsResult) && oppsResult.length > 0) {
            setHasRunScan(true);
          }
          // Open the first incomplete section automatically
          if (!biz) setOpenSection("business");
          else if (filesResult.length === 0) setOpenSection("upload");
          else if (datasetsResult.length === 0) setOpenSection("normalize");
          else setOpenSection("twin");
        }
      } catch (err: any) {
        if (!cancelled) setPageError(err?.message ?? "Failed to load business workspace.");
      } finally {
        if (!cancelled) setIsPageLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [repo]);

  // ─── Business: create or update ──────────────────────────────────────────
  async function handleSaveBusiness() {
    if (!bizName.trim() || bizName.trim().length < 2) {
      setBizAlert({ variant: "error", msg: "Business name must be at least 2 characters." });
      return;
    }
    setBizSaving(true);
    setBizAlert(null);
    try {
      const payload = { businessName: bizName.trim(), industry: bizIndustry, currency: bizCurrency, timezone: bizTimezone };
      const result = business
        ? await repo.updateBusiness(payload)
        : await repo.createBusiness(payload);
      setBusiness(result);
      setBizAlert({ variant: "success", msg: business ? "Business workspace updated." : "Business workspace created successfully." });
      if (!business) setOpenSection("upload");
    } catch (err: any) {
      const raw = err?.message ?? "";
      // 409 = already exists; try update path instead
      if (raw.toLowerCase().includes("already exists")) {
        try {
          const result = await repo.updateBusiness({ businessName: bizName.trim(), industry: bizIndustry, currency: bizCurrency, timezone: bizTimezone });
          setBusiness(result);
          setBizAlert({ variant: "success", msg: "Business workspace updated." });
        } catch (innerErr: any) {
          setBizAlert({ variant: "error", msg: innerErr?.message ?? "Failed to save business workspace." });
        }
      } else {
        setBizAlert({ variant: "error", msg: raw || "Failed to save business workspace." });
      }
    } finally {
      setBizSaving(false);
    }
  }

  // ─── File selection ───────────────────────────────────────────────────────
  function handleFileSelect(f: File | null) {
    setUploadAlert(null);
    if (!f) { setSelectedFile(null); return; }
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["csv", "xlsx", "json"].includes(ext)) {
      setUploadAlert({ variant: "error", msg: `Unsupported file type ".${ext}". Please upload .csv, .xlsx, or .json.` });
      setSelectedFile(null);
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setUploadAlert({ variant: "error", msg: `File size ${formatBytes(f.size)} exceeds 50 MB limit.` });
      setSelectedFile(null);
      return;
    }
    setSelectedFile(f);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileSelect(e.target.files?.[0] ?? null);
    // Reset value so same file can be re-selected after clearing
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0] ?? null);
  }

  // ─── Upload ───────────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!selectedFile) return;
    setUploadBusy(true);
    setUploadAlert(null);
    try {
      const uploaded = await repo.uploadFile(selectedFile);
      setFiles((prev) => [uploaded, ...prev]);
      setSelectedFile(null);
      setUploadAlert({ variant: "success", msg: `"${uploaded.filename}" uploaded — ${uploaded.rowCount?.toLocaleString() ?? "?"} rows detected.` });
      setOpenSection("normalize");
    } catch (err: any) {
      setUploadAlert({ variant: "error", msg: err?.message ?? "Upload failed. Please try again." });
    } finally {
      setUploadBusy(false);
    }
  }

  // ─── Refresh file list ────────────────────────────────────────────────────
  async function handleRefreshFiles() {
    setFilesLoading(true);
    try {
      const refreshed = await repo.listFiles();
      setFiles(refreshed);
    } finally {
      setFilesLoading(false);
    }
  }

  // ─── Delete file ──────────────────────────────────────────────────────────
  async function handleDeleteFile(fileId: string) {
    setDeletingId(fileId);
    setConfirmDeleteId(null);
    try {
      await repo.deleteFile(fileId);
      setFiles((prev) => prev.filter((f) => f.fileId !== fileId));
    } catch (err: any) {
      setUploadAlert({ variant: "error", msg: err?.message ?? "Failed to delete file." });
    } finally {
      setDeletingId(null);
    }
  }

  // ─── Normalize ────────────────────────────────────────────────────────────
  async function handleNormalize(fileId: string) {
    setNormalizingId(fileId);
    setNormAlert(null);
    try {
      const result = await repo.normalizeFile(fileId);
      setNormResult(result);
      setDatasets((prev) => [result.dataset, ...prev.filter((d) => d.fileId !== fileId)]);
      setTwin(result.digitalTwin);
      setNormAlert({ variant: "success", msg: `Normalization complete. ${result.dataset.validRows.toLocaleString()} valid rows. Data quality: ${result.dataset.dataQualityScore.toFixed(1)}%.` });
      setOpenSection("twin");
    } catch (err: any) {
      setNormAlert({ variant: "error", msg: err?.message ?? "Normalization failed. Please check your file format." });
    } finally {
      setNormalizingId(null);
    }
  }

  // ─── Refresh Digital Twin ─────────────────────────────────────────────────
  async function handleRefreshTwin() {
    setTwinLoading(true);
    setTwinAlert(null);
    try {
      const refreshed = await repo.getDigitalTwin();
      setTwin(refreshed);
    } catch (err: any) {
      setTwinAlert(err?.message ?? "Failed to refresh Digital Twin.");
    } finally {
      setTwinLoading(false);
    }
  }

  // ─── Reset Current Business Data ─────────────────────────────────────────
  async function handleResetCurrentData() {
    setResetBusy(true);
    setResetAlert(null);
    try {
      const res = await repo.resetCurrentData();
      // Update local state: mark all datasets archived or clear active
      setDatasets((prev) =>
        prev.map((d) => ({ ...d, status: "ARCHIVED", isCurrent: false }))
      );
      setTwin(null);
      setNormResult(null);
      setHasRunScan(false);
      setShowResetDialog(false);
      setResetAlert({
        variant: "success",
        msg: res.message || "Active business dataset and operational models have been reset. You can now upload a new dataset.",
      });
      // Switch to upload tab to start fresh
      setOpenSection("upload");
    } catch (err: any) {
      setResetAlert({
        variant: "error",
        msg: err?.message ?? "Failed to reset current business data. Please try again.",
      });
    } finally {
      setResetBusy(false);
    }
  }

  // ─── Run Opportunity Radar ────────────────────────────────────────────────
  async function handleRunRadar() {
    setRadarBusy(true);
    setRadarAlert(null);
    try {
      await repo.runOpportunityScan();
      setHasRunScan(true);
      setRadarAlert({ variant: "success", msg: "Opportunity Radar scan complete. Navigate to Opportunity Radar to view results." });
    } catch (err: any) {
      setRadarAlert({ variant: "error", msg: err?.message ?? "Radar scan failed. Ensure a dataset has been normalized first." });
    } finally {
      setRadarBusy(false);
    }
  }

  // ─── Computed readiness ───────────────────────────────────────────────────
  const hasBusiness = business !== null;
  const hasFile = files.length > 0;
  const hasDataset = datasets.length > 0;
  const hasTwin = twin !== null;
  const isFullyReady = hasBusiness && hasFile && hasDataset && hasTwin;

  // ─── Section toggle ───────────────────────────────────────────────────────
  function toggleSection(key: string) {
    setOpenSection((prev) => (prev === key ? "" : key));
  }

  // ─── Render: loading / error ──────────────────────────────────────────────
  if (isPageLoading) {
    return (
      <AppLayout>
        <PageContainer maxWidth="full">
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading business workspace…</p>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  if (pageError) {
    return (
      <AppLayout>
        <PageContainer maxWidth="full">
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-rose-500" />
            <p className="text-base font-semibold text-foreground">Failed to Load Workspace</p>
            <p className="text-sm text-muted-foreground max-w-sm">{pageError}</p>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        </PageContainer>
      </AppLayout>
    );
  }

  // ─── Full page render ──────────────────────────────────────────────────────
  return (
    <AppLayout>
      <PageContainer maxWidth="full" className="space-y-6 pb-16">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <PageHeader
          title="Business & Data"
          description="Set up your business workspace, upload your operational dataset, normalize it through the Decision Engine, and run your first Opportunity Radar scan."
          badge={isFullyReady ? "Ready" : "Setup Required"}
          badgeVariant={isFullyReady ? "positive" : "warning"}
        >
          {hasDataset && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-rose-500 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400"
              onClick={() => setShowResetDialog(true)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Current Data
            </Button>
          )}
          <Button
            size="sm"
            className="gap-1.5"
            onClick={handleSaveBusiness}
            isLoading={bizSaving}
            loadingText="Saving…"
            disabled={bizSaving}
          >
            <Save className="h-3.5 w-3.5" />
            {business ? "Save Changes" : "Create Business"}
          </Button>
          {isFullyReady && (
            <Button size="sm" variant="outline" className="gap-1.5" asChild>
              <Link href="/opportunities">
                <Sparkles className="h-3.5 w-3.5" />
                View Opportunities
              </Link>
            </Button>
          )}
        </PageHeader>

        {resetAlert && (
          <Alert variant={resetAlert.variant} message={resetAlert.msg} />
        )}

        {/* ── Readiness strip ─────────────────────────────────────────────── */}
        <Card className="border-border/70">
          <CardContent className="pt-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { done: hasBusiness, label: "Business", sub: "Workspace created" },
                { done: hasFile, label: "Dataset", sub: "File uploaded" },
                { done: hasDataset, label: "Normalized", sub: "Data processed" },
                { done: hasTwin, label: "Digital Twin", sub: "Model ready" },
                { done: hasRunScan, label: "Radar Scanned", sub: "Opportunities detected" },
              ].map(({ done, label, sub }) => (
                <div
                  key={label}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors",
                    done
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border/60 bg-muted/20"
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/30" />
                  )}
                  <span className={cn("text-xs font-semibold", done ? "text-foreground" : "text-muted-foreground")}>
                    {label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{sub}</span>
                </div>
              ))}
            </div>
            {!isFullyReady && (
              <p className="mt-3 text-xs text-muted-foreground text-center">
                {!hasBusiness
                  ? "Complete the Business Setup below to begin."
                  : !hasFile
                  ? "Upload a dataset to continue."
                  : !hasDataset
                  ? "Normalize your uploaded dataset to build the Digital Twin."
                  : !hasTwin
                  ? "Refresh the Digital Twin after normalization."
                  : "Run the Opportunity Radar scan to detect business opportunities."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1 — BUSINESS SETUP
        ══════════════════════════════════════════════════════════════════ */}
        <CollapsibleSection
          id="business"
          open={openSection === "business"}
          onToggle={() => toggleSection("business")}
          icon={<Building2 className="h-4 w-4" />}
          title="Business Setup"
          badge={hasBusiness ? "Configured" : "Required"}
          badgeVariant={hasBusiness ? "positive" : "warning"}
        >
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground">
              {hasBusiness
                ? `Editing workspace for "${business!.businessName}". Changes apply to all engines.`
                : "Create your business workspace. This links all datasets, metrics, and decisions to your organization."}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business Name" required>
                <Input
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="e.g. Acme Retail"
                  maxLength={100}
                />
              </Field>

              <Field label="Industry" required>
                <select
                  value={bizIndustry}
                  onChange={(e) => setBizIndustry(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </Field>

              <Field label="Currency" required>
                <select
                  value={bizCurrency}
                  onChange={(e) => setBizCurrency(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Timezone" required>
                <select
                  value={bizTimezone}
                  onChange={(e) => setBizTimezone(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            {bizAlert && <Alert variant={bizAlert.variant} message={bizAlert.msg} />}

            <div className="flex gap-2">
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleSaveBusiness}
                isLoading={bizSaving}
                loadingText="Saving…"
                disabled={bizSaving}
              >
                <Save className="h-3.5 w-3.5" />
                {business ? "Save Changes" : "Create Business"}
              </Button>
              {hasBusiness && (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setOpenSection("upload")}>
                  Continue to Dataset
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {hasBusiness && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <MetaItem label="Business ID" value={business!.id.slice(0, 16) + "…"} />
                <MetaItem label="Industry" value={business!.industry} />
                <MetaItem label="Currency" value={business!.currency} />
                <MetaItem label="Timezone" value={business!.timezone.split("/").pop() ?? business!.timezone} />
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2 — DATASET UPLOAD
        ══════════════════════════════════════════════════════════════════ */}
        <CollapsibleSection
          id="upload"
          open={openSection === "upload"}
          onToggle={() => toggleSection("upload")}
          icon={<Upload className="h-4 w-4" />}
          title="Upload Dataset"
          badge={hasFile ? `${files.length} file${files.length !== 1 ? "s" : ""}` : "No files"}
          badgeVariant={hasFile ? "positive" : "neutral"}
          disabled={!hasBusiness}
          disabledReason="Complete Business Setup first."
        >
          <div className="space-y-5">
            <p className="text-xs text-muted-foreground">
              Upload your operational dataset. Accepted formats: CSV, XLSX, JSON. Maximum 50 MB.
              Required columns include: <code className="font-mono text-[11px] bg-muted px-1 rounded">revenue</code>, <code className="font-mono text-[11px] bg-muted px-1 rounded">cogs</code>, <code className="font-mono text-[11px] bg-muted px-1 rounded">order_id</code>, and optionally <code className="font-mono text-[11px] bg-muted px-1 rounded">channel</code>, <code className="font-mono text-[11px] bg-muted px-1 rounded">marketing_spend</code>, <code className="font-mono text-[11px] bg-muted px-1 rounded">inventory_units</code>.
            </p>

            {/* Drop zone */}
            <div
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 gap-3 cursor-pointer transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : selectedFile
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-border/60 hover:border-border hover:bg-muted/20"
              )}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                className="sr-only"
                onChange={handleInputChange}
              />
              {selectedFile ? (
                <>
                  <FileText className="h-8 w-8 text-emerald-500" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setUploadAlert(null); }}
                  >
                    Clear
                  </Button>
                </>
              ) : (
                <>
                  <Upload className={cn("h-8 w-8", isDragging ? "text-primary" : "text-muted-foreground/40")} />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {isDragging ? "Drop file here" : "Drop file or click to browse"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">CSV, XLSX, JSON — max 50 MB</p>
                  </div>
                </>
              )}
            </div>

            {uploadAlert && <Alert variant={uploadAlert.variant} message={uploadAlert.msg} />}

            <div className="flex gap-2">
              <Button
                size="sm"
                className="gap-1.5"
                disabled={!selectedFile || uploadBusy}
                onClick={handleUpload}
                isLoading={uploadBusy}
                loadingText="Uploading…"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Dataset
              </Button>
            </div>

            {/* Uploaded files list */}
            {files.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <SectionLabel>Uploaded Files</SectionLabel>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={handleRefreshFiles}
                    disabled={filesLoading}
                  >
                    <RefreshCw className={cn("h-3 w-3", filesLoading && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
                <div className="space-y-2">
                  {files.map((f) => (
                    <div
                      key={f.fileId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{f.filename}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {f.fileType.toUpperCase()} · {formatBytes(f.size)} · {f.rowCount?.toLocaleString() ?? "?"} rows
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={f.processingStatus === "processed" ? "positive" : f.processingStatus === "error" ? "critical" : "neutral"}
                          className="text-[10px]"
                        >
                          {f.processingStatus}
                        </Badge>
                        {confirmDeleteId === f.fileId ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-rose-500 font-medium">Delete?</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 text-[10px] px-2"
                              onClick={() => handleDeleteFile(f.fileId)}
                              disabled={deletingId === f.fileId}
                            >
                              {deletingId === f.fileId ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 text-[10px] px-2"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              No
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500"
                            onClick={() => setConfirmDeleteId(f.fileId)}
                            title="Delete file"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 3 — NORMALIZATION
        ══════════════════════════════════════════════════════════════════ */}
        <CollapsibleSection
          id="normalize"
          open={openSection === "normalize"}
          onToggle={() => toggleSection("normalize")}
          icon={<Database className="h-4 w-4" />}
          title="Normalize & Process"
          badge={hasDataset ? "Completed" : "Pending"}
          badgeVariant={hasDataset ? "positive" : "neutral"}
          disabled={!hasFile}
          disabledReason="Upload a dataset first."
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Select an uploaded file and run the normalization pipeline. The Decision Engine will parse columns, validate data integrity, map to the canonical schema, and build your Business Digital Twin.
            </p>

            {normAlert && <Alert variant={normAlert.variant} message={normAlert.msg} />}

            {files.length === 0 ? (
              <p className="text-xs text-muted-foreground">No files uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {files.map((f) => {
                  const isAlreadyNorm = datasets.some((d) => d.fileId === f.fileId);
                  const isBusy = normalizingId === f.fileId;
                  return (
                    <div
                      key={f.fileId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{f.filename}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {f.rowCount?.toLocaleString() ?? "?"} rows · {f.fileType.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isAlreadyNorm && (
                          <Badge variant="positive" className="text-[10px]">Normalized</Badge>
                        )}
                        <Button
                          size="sm"
                          variant={isAlreadyNorm ? "outline" : "default"}
                          className="h-7 text-xs gap-1.5"
                          disabled={isBusy || normalizingId !== null}
                          onClick={() => handleNormalize(f.fileId)}
                        >
                          {isBusy ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Processing…
                            </>
                          ) : isAlreadyNorm ? (
                            <>
                              <RefreshCw className="h-3 w-3" />
                              Re-normalize
                            </>
                          ) : (
                            <>
                              <Cpu className="h-3 w-3" />
                              Normalize
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Normalization results */}
            {normResult && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Normalization Result</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <MetaItem label="Total Rows" value={normResult.dataset.totalRows.toLocaleString()} />
                  <MetaItem label="Valid Rows" value={normResult.dataset.validRows.toLocaleString()} />
                  <MetaItem label="Invalid Rows" value={normResult.dataset.invalidRows.toLocaleString()} />
                  <MetaItem label="Data Quality" value={`${normResult.dataset.dataQualityScore.toFixed(1)}%`} />
                </div>
                {normResult.dataset.unmappedColumns.length > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    Unmapped columns (ignored by engine):{" "}
                    <span className="font-mono">{normResult.dataset.unmappedColumns.join(", ")}</span>
                  </p>
                )}
              </div>
            )}

            {/* Datasets history */}
            {datasets.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <SectionLabel>Dataset Lineage</SectionLabel>
                  {hasDataset && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs gap-1 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                      onClick={() => setShowResetDialog(true)}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Reset Active Data
                    </Button>
                  )}
                </div>
                {datasets.map((ds) => {
                  const isActive = ds.status === "ACTIVE" || ds.isCurrent;
                  return (
                    <div key={ds.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-foreground truncate">{ds.filename}</p>
                          {ds.version && (
                            <span className="text-[10px] text-muted-foreground font-mono">v{ds.version}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {ds.validRows.toLocaleString()} valid rows · quality {ds.dataQualityScore.toFixed(1)}%
                        </p>
                      </div>
                      <Badge variant={isActive ? "positive" : "neutral"} className="text-[10px] shrink-0">
                        {isActive ? "Active Model" : "Archived"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 4 — DIGITAL TWIN STATUS
        ══════════════════════════════════════════════════════════════════ */}
        <CollapsibleSection
          id="twin"
          open={openSection === "twin"}
          onToggle={() => toggleSection("twin")}
          icon={<BarChart3 className="h-4 w-4" />}
          title="Business Digital Twin"
          badge={hasTwin ? "Active" : "Not Ready"}
          badgeVariant={hasTwin ? "positive" : "neutral"}
          disabled={!hasDataset}
          disabledReason="Normalize a dataset to build the Digital Twin."
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {hasTwin
                  ? `Digital Twin active for "${twin!.businessName}". Data quality: ${twin!.dataQualityScore.toFixed(1)}%.`
                  : "Run normalization to build the Business Digital Twin. Metrics will appear here after processing."}
              </p>
              {hasTwin && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1 shrink-0"
                  onClick={handleRefreshTwin}
                  disabled={twinLoading}
                >
                  <RefreshCw className={cn("h-3 w-3", twinLoading && "animate-spin")} />
                  Refresh
                </Button>
              )}
            </div>

            {twinAlert && <Alert variant="error" message={twinAlert} />}

            {hasTwin && twin && (
              <>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <MetaItem label="Business" value={twin.businessName} />
                  <MetaItem label="Currency" value={twin.currency} />
                  <MetaItem label="Period" value={twin.periodStart ? `${twin.periodStart} → ${twin.periodEnd}` : "Auto-detected"} />
                  <MetaItem label="Quality Score" value={`${twin.dataQualityScore.toFixed(1)}%`} />
                </div>

                {Object.keys(twin.metrics).length > 0 && (
                  <div className="space-y-2">
                    <SectionLabel>Computed Metrics</SectionLabel>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {Object.entries(twin.metrics).map(([key, m]) => (
                        <div
                          key={key}
                          className={cn(
                            "rounded-lg border p-3 space-y-0.5",
                            m.available
                              ? "border-border/60 bg-card"
                              : "border-border/40 bg-muted/10 opacity-70"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-foreground">{m.name}</span>
                            {m.available ? (
                              <Badge variant="positive" className="text-[9px] px-1.5">Available</Badge>
                            ) : (
                              <Badge variant="neutral" className="text-[9px] px-1.5">N/A</Badge>
                            )}
                          </div>
                          <p className={cn("text-sm font-bold", m.available ? "text-foreground" : "text-muted-foreground")}>
                            {m.formattedValue}
                          </p>
                          {!m.available && m.reason && (
                            <p className="text-[10px] text-muted-foreground">{m.reason}</p>
                          )}
                          {m.available && m.confidence !== undefined && (
                            <p className="text-[10px] text-muted-foreground">Confidence: {m.confidence.toFixed(0)}%</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleSection>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 5 — OPPORTUNITY RADAR
        ══════════════════════════════════════════════════════════════════ */}
        <CollapsibleSection
          id="radar"
          open={openSection === "radar"}
          onToggle={() => toggleSection("radar")}
          icon={<Radar className="h-4 w-4" />}
          title="Opportunity Radar"
          badge={hasRunScan ? "Scan Run" : "Not yet run"}
          badgeVariant={hasRunScan ? "positive" : "neutral"}
          disabled={!hasTwin}
          disabledReason="Build the Digital Twin first."
        >
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Run a deterministic radar scan across your business data to detect margin leakage, growth opportunities, pricing leverage, and supply chain risks.
              The scan calls <code className="font-mono text-[11px] bg-muted px-1 rounded">POST /api/opportunities/scan</code> — results appear in the Opportunity Radar page.
            </p>

            {radarAlert && <Alert variant={radarAlert.variant} message={radarAlert.msg} />}

            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleRunRadar}
                disabled={radarBusy || !hasTwin}
                isLoading={radarBusy}
                loadingText="Scanning…"
              >
                <Radar className="h-3.5 w-3.5" />
                {hasRunScan ? "Re-run Radar Scan" : "Run Opportunity Radar"}
              </Button>
              {hasRunScan && (
                <Button size="sm" variant="outline" className="gap-1.5" asChild>
                  <Link href="/opportunities">
                    <Sparkles className="h-3.5 w-3.5" />
                    View Opportunities
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>

            {!hasTwin && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  Upload and normalize a dataset first. The Opportunity Radar engine requires a Business Digital Twin to run deterministic scans.
                </span>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* ── Continue prompt ─────────────────────────────────────────────── */}
        {isFullyReady && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">Business Digital Twin ready</p>
              <p className="text-xs text-muted-foreground">
                Your workspace is fully configured. Continue to the decision pipeline.
              </p>
            </div>
            <Button size="sm" className="gap-1.5 shrink-0" asChild>
              <Link href="/opportunities">
                <Sparkles className="h-3.5 w-3.5" />
                Open Opportunity Radar
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}

        {/* ── Reset Data Confirmation Dialog ─────────────────────────────── */}
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

      </PageContainer>
    </AppLayout>
  );
}

// ─── CollapsibleSection ────────────────────────────────────────────────────────

interface CollapsibleSectionProps {
  id: string;
  open: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  title: string;
  badge?: string;
  badgeVariant?: "positive" | "warning" | "neutral" | "enterprise" | "default";
  disabled?: boolean;
  disabledReason?: string;
  children: React.ReactNode;
}

function CollapsibleSection({
  open,
  onToggle,
  icon,
  title,
  badge,
  badgeVariant = "neutral",
  disabled,
  disabledReason,
  children,
}: CollapsibleSectionProps) {
  return (
    <Card className={cn("border-border/70", disabled && "opacity-60")}>
      <CardHeader
        className="cursor-pointer select-none pb-3"
        onClick={disabled ? undefined : onToggle}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{icon}</span>
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            {badge && (
              <Badge variant={badgeVariant} className="text-[10px]">
                {badge}
              </Badge>
            )}
            {disabled && disabledReason && (
              <span className="text-[10px] text-muted-foreground">— {disabledReason}</span>
            )}
          </div>
          {!disabled && (
            open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {open && !disabled && (
        <CardContent className="pt-0 pb-5">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

// ─── MetaItem ──────────────────────────────────────────────────────────────────

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold text-foreground truncate">{value}</p>
    </div>
  );
}
