/**
 * DecisionOS — Frontend API Client Helper
 * Handles REST requests to FastAPI backend with bearer auth and error unwrapping.
 */

import { AppError } from "@/lib/errors/api-error";
import type { ApiResponse } from "@/types/api";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  }
  return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("decisionos_auth_token");
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanPath}`;

  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    throw new AppError(
      `Failed to connect to DecisionOS backend at ${url}: ${message}`,
      "INTERNAL_SERVER_ERROR",
      500
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new AppError(
        `DecisionOS API error (${response.status}): ${response.statusText}`,
        "INTERNAL_SERVER_ERROR",
        response.status
      );
    }
    return {} as T;
  }

  if (!response.ok || (data && data.success === false)) {
    // FastAPI HTTPException shape:  { detail: { code, message } }  or  { detail: "string" }
    // DecisionOS error envelope:    { success: false, error: { code, message } }
    const detailMsg =
      typeof data?.detail === "object" && data?.detail !== null
        ? data.detail.message
        : typeof data?.detail === "string"
        ? data.detail
        : undefined;
    const errorMsg =
      data?.error?.message ||
      detailMsg ||
      data?.message ||
      `API request failed with status ${response.status}`;
    const errorCode =
      data?.error?.code ||
      (typeof data?.detail === "object" ? data?.detail?.code : undefined) ||
      "INTERNAL_SERVER_ERROR";
    throw new AppError(errorMsg, errorCode, response.status, data?.error?.details);
  }

  // If response is wrapped in standard ApiResponse<T>, unwrap data
  if (data && typeof data === "object" && "data" in data && "success" in data) {
    return data.data as T;
  }

  return data as T;
}
