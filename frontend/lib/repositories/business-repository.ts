/**
 * DecisionOS — Business Repository Interface
 *
 * Abstracts all business workspace, file upload, normalization, and
 * digital-twin operations. Both the mock and the live API implementation
 * must satisfy this contract.
 */

import type {
  BusinessWorkspace,
  CreateBusinessRequest,
  UpdateBusinessRequest,
  UploadedFile,
  DatasetRecord,
  DigitalTwin,
  NormalizationResult,
  DatasetResetResult,
  DatasetHistorySummary,
  DatasetHistoryDetail,
} from "@/types/business";

export interface BusinessRepository {
  // ── Business Workspace ────────────────────────────────────────────────────
  /** GET /api/business — throws if not found */
  getBusiness(): Promise<BusinessWorkspace>;

  /** POST /api/business — create new workspace */
  createBusiness(data: CreateBusinessRequest): Promise<BusinessWorkspace>;

  /** PUT /api/business — update existing workspace */
  updateBusiness(data: UpdateBusinessRequest): Promise<BusinessWorkspace>;

  // ── File Upload & Management ──────────────────────────────────────────────
  /** POST /api/business/files (multipart) */
  uploadFile(file: File): Promise<UploadedFile>;

  /** GET /api/business/files */
  listFiles(): Promise<UploadedFile[]>;

  /** DELETE /api/business/files/{fileId} */
  deleteFile(fileId: string): Promise<void>;

  // ── Normalization + Digital Twin Pipeline ─────────────────────────────────
  /** POST /api/business/datasets/normalize/{fileId} */
  normalizeFile(fileId: string): Promise<NormalizationResult>;

  /** GET /api/business/datasets */
  listDatasets(): Promise<DatasetRecord[]>;

  /** GET /api/business/twin */
  getDigitalTwin(): Promise<DigitalTwin>;

  // ── Opportunity Radar ─────────────────────────────────────────────────────
  /** POST /api/opportunities/scan */
  runOpportunityScan(): Promise<void>;

  // ── Dataset Reset & History ───────────────────────────────────────────────
  /** POST /api/business/datasets/reset (or DELETE /api/business/datasets/current) */
  resetCurrentData(): Promise<DatasetResetResult>;

  /** GET /api/business/history */
  listHistory(): Promise<DatasetHistorySummary[]>;

  /** GET /api/business/history/{datasetId} */
  getHistoryDetail(datasetId: string): Promise<DatasetHistoryDetail>;
}

