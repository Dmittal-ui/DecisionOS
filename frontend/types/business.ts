// ─── Business Workspace & Data Ingestion Types ───────────────────────────────
// Mirrors backend schemas exactly:
//   backend/app/schemas/business.py
//   backend/app/schemas/file_record.py
//   backend/app/schemas/dataset.py
//   backend/app/schemas/digital_twin.py

// ─── Business ─────────────────────────────────────────────────────────────────

export interface BusinessWorkspace {
  id: string;
  businessId: string;
  organizationId: string;
  businessName: string;
  industry: string;
  currency: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBusinessRequest {
  businessName: string;
  industry: string;
  currency: string;
  timezone: string;
}

export interface UpdateBusinessRequest {
  businessName?: string;
  industry?: string;
  currency?: string;
  timezone?: string;
}

// ─── File Upload ───────────────────────────────────────────────────────────────

export type FileProcessingStatus = "pending" | "processed" | "error";

export interface UploadedFile {
  fileId: string;
  id: string;
  organizationId: string;
  businessId: string;
  filename: string;
  fileType: "csv" | "xlsx" | "json" | string;
  size: number;
  uploadDate: string;
  processingStatus: FileProcessingStatus;
  rowCount: number | null;
  columnCount: number | null;
  columns: string[];
  summary: Record<string, unknown> | null;
  error_message: string | null;
}

// ─── Dataset / Normalization ───────────────────────────────────────────────────

export interface DatasetRecord {
  id: string;
  datasetId: string;
  fileId: string;
  organizationId: string;
  businessId: string;
  filename: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  columnsMapped: Record<string, string>;
  unmappedColumns: string[];
  validationErrors: string[] | Record<string, unknown>[];
  dataQualityScore: number;
  status?: "ACTIVE" | "ARCHIVED" | string;
  version?: number;
  isCurrent?: boolean;
  archivedAt?: string | null;
  createdAt: string;
}

// ─── Dataset History & Reset Types ─────────────────────────────────────────────

export interface DatasetHistorySummary {
  id: string;
  datasetId: string;
  dataset_id?: string;
  filename: string;
  fileId: string;
  file_id?: string;
  organizationId: string;
  organization_id?: string;
  businessName: string;
  business_name?: string;
  version: number;
  status: "ACTIVE" | "ARCHIVED" | string;
  isCurrent: boolean;
  is_current?: boolean;
  totalRows: number;
  total_rows?: number;
  validRows: number;
  valid_rows?: number;
  dataQualityScore: number;
  data_quality_score?: number;
  createdAt: string;
  created_at?: string;
  archivedAt?: string | null;
  archived_at?: string | null;
  hasTwin: boolean;
  has_twin?: boolean;
  opportunitiesCount: number;
  opportunities_count?: number;
  decisionsCount: number;
  decisions_count?: number;
}

export interface DatasetHistoryDetail {
  dataset: DatasetRecord;
  isCurrent: boolean;
  digitalTwin: DigitalTwin | null;
  opportunities: Record<string, unknown>[];
  investigations: Record<string, unknown>[];
  scenarios: Record<string, unknown>[];
  optimizerResults: Record<string, unknown>[];
  decisions: Record<string, unknown>[];
  decisionDna: Record<string, unknown>[];
  disclosures: {
    datasetId: string;
    isCurrent: boolean;
    observedData: string;
    modelAssumptions: string;
    simulatedValues: string;
    lineageNotice: string;
  };
}

export interface DatasetResetResult {
  reset: boolean;
  archivedDatasetId?: string | null;
  archivedDatasetName?: string | null;
  message: string;
}

// ─── Digital Twin ──────────────────────────────────────────────────────────────

export interface MetricState {
  name: string;
  value: number | null;
  formattedValue: string;
  unit: "currency" | "count" | "percentage" | "ratio" | string;
  available: boolean;
  confidence: number;
  trend?: "up" | "down" | "flat" | string;
  changePercentage?: number | null;
  reason?: string | null;
  sampleSize?: number;
}

export interface DigitalTwin {
  id: string;
  twinId: string;
  businessId: string;
  organizationId: string;
  businessName: string;
  currency: string;
  periodStart: string | null;
  periodEnd: string | null;
  metrics: Record<string, MetricState>;
  channelMetrics: Record<string, unknown>;
  dataQualityScore: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Normalization pipeline result (POST /api/business/datasets/normalize/{fileId}) ───

export interface NormalizationResult {
  dataset: DatasetRecord;
  digitalTwin: DigitalTwin;
}

// ─── Readiness state (computed in frontend, not from backend) ─────────────────

export interface BusinessReadiness {
  hasBusiness: boolean;
  hasUploadedFile: boolean;
  hasNormalizedDataset: boolean;
  hasDigitalTwin: boolean;
  hasRunScan: boolean;
}

