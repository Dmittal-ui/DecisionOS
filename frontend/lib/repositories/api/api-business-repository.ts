/**
 * DecisionOS — Live API Business Repository
 *
 * Connects the frontend to FastAPI backend endpoints for all
 * business workspace, file ingestion, normalization, and digital-twin calls.
 *
 * All calls go through apiFetch which:
 *   – Injects Authorization: Bearer <JWT>
 *   – Unwraps { success: true, data: T } envelopes automatically
 *   – Converts FastAPI error shapes to AppError
 *
 * apiFetch is NOT used for multipart file upload (no Content-Type header can
 * be set manually with FormData — the browser must set it with the boundary).
 * File upload uses a manual fetch() call with the JWT from getAuthToken().
 */

import type { BusinessRepository } from "../business-repository";
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
import { apiFetch, getApiBaseUrl, getAuthToken } from "./api-client";

export class ApiBusinessRepository implements BusinessRepository {
  // ── Business Workspace ──────────────────────────────────────────────────

  async getBusiness(): Promise<BusinessWorkspace> {
    return apiFetch<BusinessWorkspace>("/api/business");
  }

  async createBusiness(data: CreateBusinessRequest): Promise<BusinessWorkspace> {
    return apiFetch<BusinessWorkspace>("/api/business", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateBusiness(data: UpdateBusinessRequest): Promise<BusinessWorkspace> {
    return apiFetch<BusinessWorkspace>("/api/business", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ── File Upload & Management ────────────────────────────────────────────

  /**
   * File upload uses raw fetch() with FormData so the browser sets the
   * correct multipart/form-data Content-Type with boundary automatically.
   * apiFetch would overwrite Content-Type with application/json, breaking
   * the multipart envelope.
   */
  async uploadFile(file: File): Promise<UploadedFile> {
    const baseUrl = getApiBaseUrl();
    const token = getAuthToken();

    const form = new FormData();
    form.append("file", file);

    const res = await fetch(`${baseUrl}/api/business/files`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    let json: any;
    try {
      json = await res.json();
    } catch {
      throw new Error(`Upload failed (${res.status}): ${res.statusText}`);
    }

    if (!res.ok || json?.success === false) {
      const msg =
        json?.detail?.message ||
        json?.detail ||
        json?.error?.message ||
        `Upload failed with status ${res.status}`;
      throw new Error(msg);
    }

    // Unwrap ApiResponse<FileMetadataResponse> envelope
    return (json?.data ?? json) as UploadedFile;
  }

  async listFiles(): Promise<UploadedFile[]> {
    const data = await apiFetch<UploadedFile[]>("/api/business/files");
    return Array.isArray(data) ? data : [];
  }

  async deleteFile(fileId: string): Promise<void> {
    await apiFetch(`/api/business/files/${encodeURIComponent(fileId)}`, {
      method: "DELETE",
    });
  }

  // ── Normalization + Digital Twin Pipeline ───────────────────────────────

  async normalizeFile(fileId: string): Promise<NormalizationResult> {
    return apiFetch<NormalizationResult>(
      `/api/business/datasets/normalize/${encodeURIComponent(fileId)}`,
      { method: "POST" }
    );
  }

  async listDatasets(): Promise<DatasetRecord[]> {
    const data = await apiFetch<DatasetRecord[]>("/api/business/datasets");
    return Array.isArray(data) ? data : [];
  }

  async getDigitalTwin(): Promise<DigitalTwin> {
    return apiFetch<DigitalTwin>("/api/business/twin");
  }

  // ── Opportunity Radar ───────────────────────────────────────────────────

  async runOpportunityScan(): Promise<void> {
    await apiFetch("/api/opportunities/scan", { method: "POST" });
  }

  // ── Dataset Reset & History ─────────────────────────────────────────────

  async resetCurrentData(): Promise<DatasetResetResult> {
    return apiFetch<DatasetResetResult>("/api/business/datasets/reset", {
      method: "POST",
    });
  }

  async listHistory(): Promise<DatasetHistorySummary[]> {
    const data = await apiFetch<DatasetHistorySummary[]>("/api/business/history");
    return Array.isArray(data) ? data : [];
  }

  async getHistoryDetail(datasetId: string): Promise<DatasetHistoryDetail> {
    return apiFetch<DatasetHistoryDetail>(
      `/api/business/history/${encodeURIComponent(datasetId)}`
    );
  }
}

