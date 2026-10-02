"""
DecisionOS Backend — Common API Schemas

Defines the standard JSON envelope that every endpoint returns,
matching the frontend's ApiResponse<T> interface in types/api.ts.

Frontend contract (types/api.ts):
    interface ApiResponse<T> {
      success: boolean;
      data: T;
      meta?: PaginationMeta | Record<string, unknown>;
      message?: string;
    }
"""

from typing import Any, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


# ── Success envelope ──────────────────────────────────────────────────────────

class PaginationMeta(BaseModel):
    """Matches frontend PaginationMeta in types/api.ts."""
    page: int = 1
    page_size: int = 20
    total_items: int = 0
    total_pages: int = 1
    has_next_page: bool = False
    has_previous_page: bool = False


class ApiResponse(BaseModel, Generic[T]):
    """
    Standard success envelope returned by every DecisionOS endpoint.
    Mirrors the frontend ApiResponse<T> interface exactly.
    """
    success: bool = True
    data: T
    meta: dict[str, Any] | None = None
    message: str | None = None

    model_config = {"arbitrary_types_allowed": True}


# ── Error envelope ────────────────────────────────────────────────────────────

class ApiErrorDetail(BaseModel):
    """Individual field-level error detail."""
    field: str | None = None
    message: str
    code: str | None = None


class ApiErrorBody(BaseModel):
    """
    Standard error envelope returned on all 4xx / 5xx responses.
    Mirrors the frontend ApiError interface in types/api.ts.
    """
    success: bool = False
    error: dict[str, Any]


# ── Error code constants ──────────────────────────────────────────────────────
# Must match ApiErrorCode union in frontend types/api.ts

class ErrorCode:
    BAD_REQUEST = "BAD_REQUEST"
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    CONFLICT = "CONFLICT"
    UNPROCESSABLE_ENTITY = "UNPROCESSABLE_ENTITY"
    CONSTRAINT_VIOLATION = "CONSTRAINT_VIOLATION"
    SOLVER_TIMEOUT = "SOLVER_TIMEOUT"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
