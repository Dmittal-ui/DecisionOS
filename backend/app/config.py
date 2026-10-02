"""
DecisionOS Backend — Application Configuration
Reads from environment variables / .env file.
All settings are validated at startup via Pydantic Settings.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Central configuration object.
    Values are loaded from environment variables or a .env file at the project root.
    Pydantic validates types and raises an error at startup if required values are missing.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────────────────
    app_env: str = "development"
    app_debug: bool = True

    # ── MongoDB ───────────────────────────────────────────────────────────────
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_database: str = "decisionos"

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Stored as a comma-separated string in .env, parsed into a list below.
    cors_allowed_origins: str = "http://localhost:3000,http://localhost:3001"

    @property
    def cors_origins_list(self) -> list[str]:
        """Returns CORS origins as a clean list."""
        return [o.strip() for o in self.cors_allowed_origins.split(",") if o.strip()]

    # ── JWT ───────────────────────────────────────────────────────────────────
    # IMPORTANT: Set a long random string in .env for production.
    # Generate with: python3 -c "import secrets; print(secrets.token_hex(64))"
    jwt_secret_key: str = "change-this-to-a-long-random-secret-in-production-min-64-chars"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 24

    # ── Uploads & Storage ─────────────────────────────────────────────────────
    upload_dir: str = "uploads"
    max_upload_size_bytes: int = 52_428_800  # 50 MB

    # ── Application metadata ──────────────────────────────────────────────────
    app_title: str = "DecisionOS API"
    app_description: str = (
        "AI-Powered Business Decision Engine — Backend REST API. "
        "Deterministic decision engine for opportunity detection, "
        "scenario simulation, and constraint-aware optimization."
    )
    app_version: str = "1.0.0-phase3"


@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached Settings singleton.
    Use this as a FastAPI dependency: Depends(get_settings).
    """
    return Settings()
