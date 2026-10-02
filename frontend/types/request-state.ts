// ─── Phase 12 Request State Types ──────────────────────────────────────────
// Common state management abstraction for frontend async operations.

export type RequestStatus = "idle" | "loading" | "success" | "error" | "empty";

export interface RequestState<T> {
  status: RequestStatus;
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isEmpty: boolean;
}

export function createInitialRequestState<T>(initialData: T | null = null): RequestState<T> {
  return {
    status: "idle",
    data: initialData,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    isEmpty: false,
  };
}

export function createLoadingRequestState<T>(previousData: T | null = null): RequestState<T> {
  return {
    status: "loading",
    data: previousData,
    error: null,
    isLoading: true,
    isSuccess: false,
    isError: false,
    isEmpty: false,
  };
}

export function createSuccessRequestState<T>(data: T, isEmpty = false): RequestState<T> {
  return {
    status: isEmpty ? "empty" : "success",
    data,
    error: null,
    isLoading: false,
    isSuccess: !isEmpty,
    isError: false,
    isEmpty,
  };
}

export function createErrorRequestState<T>(error: string, previousData: T | null = null): RequestState<T> {
  return {
    status: "error",
    data: previousData,
    error,
    isLoading: false,
    isSuccess: false,
    isError: true,
    isEmpty: false,
  };
}
