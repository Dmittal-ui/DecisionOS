"""
DecisionOS — Data Normalizer & Validation Engine

Transforms heterogeneous client data files (CSV, XLSX, JSON) into
the standardized DecisionOS Canonical Schema.
Enforces strict validation, detects corruption/anomalies, and computes data quality scores.
Never fabricates missing data.
"""

import logging
import re
from typing import Any, Tuple

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Canonical Column Aliases Dictionary
# ─────────────────────────────────────────────────────────────────────────────
CANONICAL_ALIASES: dict[str, set[str]] = {
    "date": {
        "date", "sale_date", "order_date", "timestamp", "transaction_date", "txn_date",
        "day", "created_at", "time", "order_timestamp", "datetime"
    },
    "order_id": {
        "order_id", "order_number", "transaction_id", "order_code", "id", "order_ref", "order_num",
        "order", "invoice_no", "invoice_id", "receipt_id"
    },
    "customer_id": {
        "customer_id", "cust_id", "client_id", "user_id", "buyer_id",
        "account_id", "customer", "shopper_id"
    },
    "product_id": {
        "product_id", "sku", "item_id", "product_code", "product",
        "item_name", "product_name", "item"
    },
    "channel": {
        "channel", "sales_channel", "source", "platform", "acquisition_channel", "channel_name",
        "store", "marketplace", "distribution_channel"
    },
    "revenue": {
        # Unambiguously total-revenue / sales-value fields only.
        # Per-unit prices (selling_price, unit_price) are NOT summed as revenue —
        # they represent a rate, not an aggregated monetary flow.
        # "amount" alone is too ambiguous (could be quantity, fee, tax).
        "revenue", "total_sales", "sales", "gross_sales", "turnover", "sales_amount",
        "total_amount", "order_value", "gmv", "gross_merchandise_value",
        "net_revenue", "net_sales", "total_revenue", "sale_amount",
    },
    "quantity": {
        "quantity", "qty", "units", "units_sold", "volume", "count",
        "item_count", "order_quantity", "num_units"
    },
    "cost": {
        # COGS / total product cost fields only.
        # "expense" alone is too broad — it could be operating_expense.
        # "unit_cost" is a per-unit rate; if present as a column it needs quantity×unit_cost — not handled here.
        "cost", "cogs", "product_cost", "total_cost", "cost_goods",
        "cost_of_goods_sold", "manufacturing_cost", "cogs_total", "total_cogs",
    },
    "marketing_spend": {
        "marketing_spend", "ad_spend", "spend", "marketing_cost",
        "cac_spend", "advertising", "campaign_cost", "ad_cost"
    },
    "visitors": {
        "visitors", "traffic", "sessions", "impressions", "clicks",
        "users", "pageviews", "visits"
    },
    "inventory": {
        # Unit-count fields — number of physical units on hand.
        # Do NOT add monetary value fields here (see inventory_value below).
        "inventory", "stock", "stock_level", "available_stock",
        "on_hand", "working_inventory", "units_in_stock",
        "inventory_units", "stock_units",
    },
    # Separate canonical for monetary inventory value (₹ amount, not unit count).
    # Kept distinct so a dataset supplying inventory_value doesn't get its
    # rupee amount summed/snapshot-read as if it were a unit count.
    "inventory_value": {
        "inventory_value", "stock_value",
    },
    "operating_expense": {
        "operating_expense", "opex", "overhead", "operating_cost",
        "fulfillment_cost", "shipping_cost", "logistics_cost"
    },
    # Direct conversion_rate column — read by MetricEngine as a pre-computed value
    # so datasets that supply it directly do not need separate visitors + orders columns.
    "conversion_rate": {
        "conversion_rate", "cvr", "conv_rate", "conversion", "checkout_conversion",
        "order_conversion_rate", "purchase_rate",
    },
}

NUMERIC_COLUMNS = {
    "revenue", "quantity", "cost", "marketing_spend",
    "visitors", "inventory", "inventory_value", "operating_expense", "conversion_rate"
}


def _clean_header_string(header: Any) -> str:
    """Normalizes raw header string to lowercase alphanumeric with underscores."""
    s = str(header).strip().lower()
    s = re.sub(r"[\s\-]+", "_", s)
    s = re.sub(r"[^\w]", "", s)
    return s


def detect_and_map_columns(df: pd.DataFrame) -> Tuple[pd.DataFrame, dict[str, str], list[str]]:
    """
    Scans DataFrame columns and maps matching headers to canonical schema fields.

    Returns:
        (df_with_canonical_cols, mapped_columns_dict, unmapped_columns_list)
    """
    mapped_columns: dict[str, str] = {}
    unmapped_columns: list[str] = []
    rename_mapping: dict[str, str] = {}

    assigned_canonicals: set[str] = set()

    for col in df.columns:
        cleaned = _clean_header_string(col)
        matched_canonical = None

        for canonical, aliases in CANONICAL_ALIASES.items():
            if cleaned in aliases and canonical not in assigned_canonicals:
                matched_canonical = canonical
                assigned_canonicals.add(canonical)
                break

        if matched_canonical:
            mapped_columns[str(col)] = matched_canonical
            rename_mapping[str(col)] = matched_canonical
        else:
            unmapped_columns.append(str(col))

    # Rename matched columns
    normalized_df = df.rename(columns=rename_mapping).copy()
    return normalized_df, mapped_columns, unmapped_columns


def validate_and_clean_dataframe(
    df: pd.DataFrame,
    mapped_columns: dict[str, str],
) -> Tuple[pd.DataFrame, dict[str, Any]]:
    """
    Validates data integrity, date formats, and numeric types.
    Does NOT fabricate missing data.

    Returns:
        (cleaned_df, validation_summary)

    Raises:
        ValueError if the dataset is completely empty or lacks any recognizable business signals.
    """
    if df.empty or len(df) == 0:
        raise ValueError("The uploaded dataset is empty (0 rows). At least 1 valid row is required.")

    # Check minimum viable commercial signal
    core_signals = {"revenue", "quantity", "cost", "date", "order_id"}
    recognized = set(mapped_columns.values())
    if not recognized.intersection(core_signals):
        raise ValueError(
            "Dataset contains no recognizable business or transaction fields. "
            "Supported fields include: sale_date/date, revenue/total_sales, qty/quantity, cost, order_id."
        )

    validation_errors: list[dict[str, Any]] = []
    validation_warnings: list[dict[str, Any]] = []

    total_rows = len(df)
    invalid_row_indices: set[int] = set()

    # 1. Date Validation
    if "date" in df.columns:
        parsed_dates = pd.to_datetime(df["date"], errors="coerce")
        invalid_dates_count = int(parsed_dates.isna().sum())
        if invalid_dates_count > 0:
            validation_warnings.append({
                "type": "INVALID_DATES",
                "message": f"Found {invalid_dates_count} invalid or unparseable date values.",
                "count": invalid_dates_count,
            })
            # Mark rows with invalid dates
            for idx in df[parsed_dates.isna()].index:
                invalid_row_indices.add(idx)
        df["date"] = parsed_dates

    # 2. Numeric Field Validation
    for col in NUMERIC_COLUMNS:
        if col in df.columns:
            # Check for non-numeric values
            numeric_series = pd.to_numeric(df[col], errors="coerce")
            nan_count = int(numeric_series.isna().sum())
            if nan_count > 0:
                validation_errors.append({
                    "column": col,
                    "type": "INVALID_NUMERIC_VALUES",
                    "message": f"Column '{col}' contains {nan_count} non-numeric or missing entries.",
                    "count": nan_count,
                })
                for idx in df[numeric_series.isna()].index:
                    invalid_row_indices.add(idx)

            # Check for illegal negative values where prohibited (e.g. quantity, cost, revenue)
            if col in {"quantity", "cost"}:
                negatives = (numeric_series < 0).sum()
                if negatives > 0:
                    validation_errors.append({
                        "column": col,
                        "type": "NEGATIVE_VALUES",
                        "message": f"Column '{col}' contains {int(negatives)} negative values.",
                        "count": int(negatives),
                    })
                    for idx in df[numeric_series < 0].index:
                        invalid_row_indices.add(idx)

            df[col] = numeric_series

    # 3. Duplicate Detection
    duplicate_rows = int(df.duplicated().sum())
    if duplicate_rows > 0:
        validation_warnings.append({
            "type": "DUPLICATE_ROWS",
            "message": f"Identified {duplicate_rows} duplicate rows.",
            "count": duplicate_rows,
        })

    # Calculate Data Quality Score (0 to 100)
    valid_rows_count = max(0, total_rows - len(invalid_row_indices))
    validity_ratio = valid_rows_count / total_rows if total_rows > 0 else 0.0

    # Penalties for duplicate rows or missing key fields
    penalty = 0.0
    if duplicate_rows > 0:
        penalty += min(15.0, (duplicate_rows / total_rows) * 20.0)

    quality_score = max(0.0, min(100.0, round((validity_ratio * 100.0) - penalty, 1)))

    validation_summary = {
        "total_rows": total_rows,
        "valid_rows": valid_rows_count,
        "invalid_rows": len(invalid_row_indices),
        "duplicate_rows": duplicate_rows,
        "data_quality_score": quality_score,
        "validation_errors": validation_errors,
        "validation_warnings": validation_warnings,
    }

    return df, validation_summary
