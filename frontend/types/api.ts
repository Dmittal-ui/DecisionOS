// ─── Phase 12 API Contract Types ──────────────────────────────────────────
// Standard API contract envelope, pagination, and error representations
// designed for seamless future integration with Person B's FastAPI backend.

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
  message?: string;
}

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "CONSTRAINT_VIOLATION"
  | "SOLVER_TIMEOUT"
  | "INTERNAL_SERVER_ERROR";

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  details?: ApiErrorDetail[];
  statusCode?: number;
}

export type ApiStatus = "idle" | "loading" | "success" | "error";
