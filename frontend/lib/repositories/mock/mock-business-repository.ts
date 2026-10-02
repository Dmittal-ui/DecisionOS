/**
 * DecisionOS — Mock Business Repository
 *
 * Used when NEXT_PUBLIC_USE_MOCK_DATA=true.
 * Simulates the full business onboarding workflow in-memory so the
 * page renders correctly in demo mode without a backend.
 *
 * Does NOT use UrbanCart data — returns realistic but neutral placeholder data.
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

const MOCK_BUSINESS: BusinessWorkspace = {
  id: "biz_mock_01",
  businessId: "biz_mock_01",
  organizationId: "org_mock",
  businessName: "Demo Enterprise",
  industry: "E-Commerce",
  currency: "INR",
  timezone: "Asia/Kolkata",
  createdAt: "2026-09-01T09:00:00Z",
  updatedAt: "2026-09-01T09:00:00Z",
};

const MOCK_FILE: UploadedFile = {
  fileId: "file_mock_01",
  id: "file_mock_01",
  organizationId: "org_mock",
  businessId: "biz_mock_01",
  filename: "demo_dataset.csv",
  fileType: "csv",
  size: 204800,
  uploadDate: "2026-09-01T09:05:00Z",
  processingStatus: "processed",
  rowCount: 5200,
  columnCount: 12,
  columns: ["order_id", "revenue", "cogs", "marketing_spend", "inventory_units", "channel", "date", "unit_price", "quantity", "customer_id", "region", "return_flag"],
  summary: { format: "csv", total_rows: 5200 },
  error_message: null,
};

const MOCK_DATASET: DatasetRecord = {
  id: "ds_mock_01",
  datasetId: "ds_mock_01",
  fileId: "file_mock_01",
  organizationId: "org_mock",
  businessId: "biz_mock_01",
  filename: "demo_dataset.csv",
  totalRows: 5200,
  validRows: 5148,
  invalidRows: 32,
  duplicateRows: 20,
  columnsMapped: {
    order_id: "order_id",
    revenue: "revenue",
    cogs: "cogs",
    marketing_spend: "marketing_spend",
    inventory_units: "inventory_units",
    channel: "channel",
    date: "date",
    unit_price: "unit_price",
    quantity: "quantity",
    customer_id: "customer_id",
  },
  unmappedColumns: ["region", "return_flag"],
  validationErrors: [],
  dataQualityScore: 94.2,
  status: "ACTIVE",
  version: 1,
  isCurrent: true,
  createdAt: "2026-09-01T09:10:00Z",
};

const MOCK_TWIN: DigitalTwin = {
  id: "twin_mock_01",
  twinId: "twin_mock_01",
  businessId: "biz_mock_01",
  organizationId: "org_mock",
  businessName: "Demo Enterprise",
  currency: "INR",
  periodStart: "2026-07-01",
  periodEnd: "2026-09-30",
  dataQualityScore: 94.2,
  createdAt: "2026-09-01T09:10:00Z",
  updatedAt: "2026-09-01T09:10:00Z",
  channelMetrics: {},
  metrics: {
    revenue: { name: "Revenue", value: 44800000, formattedValue: "₹4.48 Cr", unit: "currency", available: true, confidence: 96.0, trend: "up", changePercentage: 8.2 },
    grossProfit: { name: "Gross Profit", value: 17000000, formattedValue: "₹1.70 Cr", unit: "currency", available: true, confidence: 95.0, trend: "up" },
    grossMargin: { name: "Gross Margin", value: 38.0, formattedValue: "38.0%", unit: "percentage", available: true, confidence: 95.0 },
    operatingMargin: { name: "Operating Margin", value: 22.5, formattedValue: "22.5%", unit: "percentage", available: true, confidence: 91.0 },
    orders: { name: "Orders", value: 5148, formattedValue: "5,148", unit: "count", available: true, confidence: 98.0 },
    averageOrderValue: { name: "Average Order Value", value: 8705, formattedValue: "₹8,705", unit: "currency", available: true, confidence: 97.0 },
    inventoryValue: { name: "Inventory Value", value: null, formattedValue: "N/A", unit: "currency", available: false, confidence: 0, reason: "inventory_value column not found" },
    marketingSpend: { name: "Marketing Spend", value: 1400000, formattedValue: "₹1.40 Cr", unit: "currency", available: true, confidence: 93.0 },
    conversionRate: { name: "Conversion Rate", value: null, formattedValue: "N/A", unit: "percentage", available: false, confidence: 0, reason: "session data not present" },
    cac: { name: "CAC", value: null, formattedValue: "N/A", unit: "currency", available: false, confidence: 0, reason: "customer acquisition data not present" },
  },
};

export class MockBusinessRepository implements BusinessRepository {
  private business: BusinessWorkspace | null = MOCK_BUSINESS;
  private files: UploadedFile[] = [MOCK_FILE];
  private datasets: DatasetRecord[] = [MOCK_DATASET];
  private twin: DigitalTwin | null = MOCK_TWIN;

  async getBusiness(): Promise<BusinessWorkspace> {
    await delay(300);
    if (!this.business) throw new Error("No business workspace found for your organization.");
    return { ...this.business };
  }

  async createBusiness(data: CreateBusinessRequest): Promise<BusinessWorkspace> {
    await delay(600);
    this.business = {
      id: `biz_${Date.now()}`,
      businessId: `biz_${Date.now()}`,
      organizationId: "org_mock",
      businessName: data.businessName,
      industry: data.industry,
      currency: data.currency,
      timezone: data.timezone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { ...this.business };
  }

  async updateBusiness(data: UpdateBusinessRequest): Promise<BusinessWorkspace> {
    await delay(400);
    if (!this.business) throw new Error("No business workspace found.");
    this.business = {
      ...this.business,
      ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)),
      updatedAt: new Date().toISOString(),
    };
    return { ...this.business };
  }

  async uploadFile(file: File): Promise<UploadedFile> {
    await delay(800);
    const uploaded: UploadedFile = {
      fileId: `file_${Date.now()}`,
      id: `file_${Date.now()}`,
      organizationId: "org_mock",
      businessId: this.business?.id ?? "biz_mock",
      filename: file.name,
      fileType: file.name.split(".").pop() ?? "csv",
      size: file.size,
      uploadDate: new Date().toISOString(),
      processingStatus: "processed",
      rowCount: 1000,
      columnCount: 10,
      columns: ["order_id", "revenue", "cogs", "channel", "date", "unit_price", "quantity", "customer_id", "marketing_spend", "inventory_units"],
      summary: { format: file.name.split(".").pop() },
      error_message: null,
    };
    this.files.unshift(uploaded);
    return uploaded;
  }

  async listFiles(): Promise<UploadedFile[]> {
    await delay(200);
    return [...this.files];
  }

  async deleteFile(fileId: string): Promise<void> {
    await delay(400);
    this.files = this.files.filter((f) => f.fileId !== fileId);
  }

  async normalizeFile(fileId: string): Promise<NormalizationResult> {
    await delay(1500);
    const file = this.files.find((f) => f.fileId === fileId);
    if (!file) throw new Error(`File '${fileId}' not found.`);
    // Archive any previous datasets
    this.datasets = this.datasets.map(d => ({ ...d, status: "ARCHIVED", isCurrent: false, archivedAt: new Date().toISOString() }));
    const ds: DatasetRecord = {
      ...MOCK_DATASET,
      id: `ds_${Date.now()}`,
      datasetId: `ds_${Date.now()}`,
      fileId,
      status: "ACTIVE",
      version: this.datasets.length + 1,
      isCurrent: true,
      createdAt: new Date().toISOString(),
    };
    this.datasets.unshift(ds);
    this.twin = { ...MOCK_TWIN };
    return { dataset: ds, digitalTwin: { ...MOCK_TWIN } };
  }

  async listDatasets(): Promise<DatasetRecord[]> {
    await delay(200);
    return [...this.datasets];
  }

  async getDigitalTwin(): Promise<DigitalTwin> {
    await delay(300);
    if (!this.twin) throw new Error("No Digital Twin available. Upload and normalize a dataset first.");
    return { ...this.twin };
  }

  async runOpportunityScan(): Promise<void> {
    await delay(1200);
    // Mock scan — no return value needed; opportunities are fetched separately
  }

  async resetCurrentData(): Promise<DatasetResetResult> {
    await delay(500);
    const activeDs = this.datasets.find(d => d.status === "ACTIVE" || d.isCurrent);
    if (activeDs) {
      activeDs.status = "ARCHIVED";
      activeDs.isCurrent = false;
      activeDs.archivedAt = new Date().toISOString();
    }
    this.twin = null;
    return {
      reset: true,
      archivedDatasetId: activeDs?.datasetId ?? null,
      archivedDatasetName: activeDs?.filename ?? null,
      message: "Current business dataset and derived models reset successfully.",
    };
  }

  async listHistory(): Promise<DatasetHistorySummary[]> {
    await delay(300);
    return this.datasets.map(d => ({
      id: d.id,
      datasetId: d.datasetId,
      filename: d.filename,
      fileId: d.fileId,
      organizationId: d.organizationId,
      businessName: this.business?.businessName ?? "Demo Business",
      version: d.version ?? 1,
      status: d.status ?? "ARCHIVED",
      isCurrent: d.status === "ACTIVE" || Boolean(d.isCurrent),
      totalRows: d.totalRows,
      validRows: d.validRows,
      dataQualityScore: d.dataQualityScore,
      createdAt: d.createdAt,
      archivedAt: d.archivedAt,
      hasTwin: true,
      opportunitiesCount: 2,
      decisionsCount: 1,
    }));
  }

  async getHistoryDetail(datasetId: string): Promise<DatasetHistoryDetail> {
    await delay(400);
    const ds = this.datasets.find(d => d.datasetId === datasetId || d.id === datasetId) || MOCK_DATASET;
    return {
      dataset: ds,
      isCurrent: ds.status === "ACTIVE" || Boolean(ds.isCurrent),
      digitalTwin: MOCK_TWIN,
      opportunities: [],
      investigations: [],
      scenarios: [],
      optimizerResults: [],
      decisions: [],
      decisionDna: [],
      disclosures: {
        datasetId: ds.datasetId,
        isCurrent: ds.status === "ACTIVE" || Boolean(ds.isCurrent),
        observedData: "Historical metrics derived from frozen dataset ingestion.",
        modelAssumptions: "All model assumptions preserved from original snapshot.",
        simulatedValues: "Simulated scenario projections remain associated with this dataset version.",
        lineageNotice: "Historical analysis records are immutable and read-only.",
      },
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

