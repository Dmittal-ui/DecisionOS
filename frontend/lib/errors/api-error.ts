// ─── Phase 12 Centralized Application Error Classes ───────────────────────

import type { ApiErrorCode, ApiErrorDetail } from "@/types/api";

export class AppError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: ApiErrorDetail[];
  public readonly userMessage: string;

  constructor(
    userMessage: string,
    code: ApiErrorCode = "INTERNAL_SERVER_ERROR",
    statusCode = 500,
    details?: ApiErrorDetail[]
  ) {
    super(userMessage);
    this.name = "AppError";
    this.userMessage = userMessage;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id: string) {
    super(`${entity} with identifier "${id}" was not found.`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: ApiErrorDetail[]) {
    super(message, "UNPROCESSABLE_ENTITY", 422, details);
    this.name = "ValidationError";
  }
}

export class ConstraintViolationError extends AppError {
  constructor(constraintName: string, detail: string) {
    super(
      `Hard constraint "${constraintName}" was violated: ${detail}`,
      "CONSTRAINT_VIOLATION",
      400
    );
    this.name = "ConstraintViolationError";
  }
}
