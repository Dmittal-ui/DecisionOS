"""
DecisionOS — Scenario Lab Service

Manages preset levers, executes real-time microeconomic business simulations,
and persists saved scenario configurations with strict organization isolation.
"""

import logging
import uuid
from typing import Any, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.engine.scenario_engine import (
    get_default_scenario_presets,
    run_scenario_simulation,
)
from app.models.scenario import SavedScenarioDocument, ScenarioVariablesModel
from app.schemas.auth import AuthContext
from app.schemas.scenario import (
    ScenarioPresetSchema,
    ScenarioSimulationResponse,
)
from app.services.business_service import get_or_create_default_business
from app.services.dashboard_service import _get_active_dataset_and_dataframe

logger = logging.getLogger(__name__)

SCENARIOS_COLLECTION = "scenarios"


async def get_scenario_presets(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> list[ScenarioPresetSchema]:
    """Returns predefined scenario lever presets."""
    business = await get_or_create_default_business(db, auth)
    return get_default_scenario_presets(currency=business.currency or "INR")


async def list_saved_scenarios(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> list[SavedScenarioDocument]:
    """Retrieves saved scenario runs for the authenticated organization."""
    cursor = db[SCENARIOS_COLLECTION].find({"organization_id": auth.org_id}).sort("created_at", -1)
    results = []
    async for doc in cursor:
        results.append(SavedScenarioDocument.from_mongo(doc))
    return results


async def simulate_scenario(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
    levers: ScenarioVariablesModel,
    preset_id: Optional[str] = None,
    scenario_name: Optional[str] = None,
    baseline_id: Optional[str] = None,
) -> ScenarioSimulationResponse:
    """
    Executes the microeconomic simulation engine on provided business levers.
    """
    business = await get_or_create_default_business(db, auth)
    dataset, df = await _get_active_dataset_and_dataframe(db, auth)
    quality = dataset.data_quality_score if dataset else 100.0

    pid = preset_id or "preset_growth"
    response = run_scenario_simulation(
        levers=levers,
        df=df,
        preset_id=pid,
        scenario_name=scenario_name,
        currency=business.currency or "INR",
        data_quality_score=quality,
    )

    # Automatically persist simulation run for auditability
    scenario_id = f"scen_{uuid.uuid4().hex[:12]}"
    saved_doc = SavedScenarioDocument(
        id=scenario_id,
        organization_id=auth.org_id,
        business_id=business.id,
        dataset_id=dataset.id if dataset else "",
        preset_id=pid,
        name=response.scenarioName,
        variables=levers,
        projected_revenue=response.projectedRevenue,
        projected_gross_profit=response.projectedGrossProfit,
        projected_operating_margin=response.projectedOperatingMargin,
        projected_orders=response.projectedOrders,
        projected_inventory=response.projectedInventory,
        metrics=[m.model_dump() for m in response.metrics],
        constraints=[c.model_dump() for c in response.constraints],
        sensitivity=[s.model_dump() for s in response.sensitivity],
        uncertainty=response.uncertainty.model_dump(),
        tradeoffs=response.tradeoffs,
    )
    await db[SCENARIOS_COLLECTION].insert_one(saved_doc.to_mongo())

    return response


async def get_scenario_baseline(
    db: AsyncIOMotorDatabase,
    auth: AuthContext,
) -> dict:
    """
    Returns dataset-derived baseline values for the three scenario levers.

    Each value is tagged with its data classification:
    - DATA_DERIVED: computed directly from the uploaded dataset.
    - UNAVAILABLE:  column not present in the dataset; must NOT be fabricated.

    This function must be the single authoritative source of truth for what
    the Scenario Lab shows as the 'current' baseline.  It must never return
    hardcoded stale defaults (₹1.40 Cr, 1000 units, ₹100) as if they were
    actual business data.
    """
    from app.engine.metric_engine import MetricEngine, format_currency_value

    business = await get_or_create_default_business(db, auth)
    dataset, df = await _get_active_dataset_and_dataframe(db, auth)
    currency = business.currency or "INR"
    quality = dataset.data_quality_score if dataset else 100.0
    scale = 10_000_000.0  # 1 Crore = 10^7 rupees

    result: dict = {
        "currency": currency,
        "dataSource": "UNAVAILABLE" if (df is None or df.empty) else "DATA_DERIVED",
    }

    if df is None or df.empty:
        result["marketingSpend"] = {
            "source": "UNAVAILABLE",
            "valueCr": None,
            "formatted": "UNAVAILABLE",
            "reason": "No dataset uploaded.",
        }
        result["workingInventory"] = {
            "source": "UNAVAILABLE",
            "valueUnits": None,
            "formatted": "UNAVAILABLE",
            "reason": "No dataset uploaded.",
        }
        result["realPriceBaseline"] = {
            "source": "UNAVAILABLE",
            "valueRupees": None,
            "formatted": "UNAVAILABLE",
            "reason": "No dataset uploaded.",
        }
        result["operatingExpense"] = {
            "source": "UNAVAILABLE",
            "valueCr": None,
            "formatted": "UNAVAILABLE",
            "reason": "No dataset uploaded.",
        }
        return result

    m_engine = MetricEngine(df, currency=currency, data_quality_score=quality)

    # ── Marketing Spend ──────────────────────────────────────────────────────
    mktg_m = m_engine.calculate_marketing_spend()
    if mktg_m.available and mktg_m.value and mktg_m.value > 0:
        mktg_cr = mktg_m.value / scale
        result["marketingSpend"] = {
            "source": "DATA_DERIVED",
            "valueCr": round(mktg_cr, 4),
            "formatted": format_currency_value(mktg_m.value, currency),
            "reason": None,
        }
    else:
        result["marketingSpend"] = {
            "source": "UNAVAILABLE",
            "valueCr": None,
            "formatted": "UNAVAILABLE",
            "reason": "marketing_spend column not found in dataset.",
        }

    # ── Working Inventory ────────────────────────────────────────────────────
    if "inventory" in df.columns:
        inv_clean = df["inventory"].dropna()
        if len(inv_clean) > 0:
            latest_inv = float(inv_clean.iloc[-1])
            result["workingInventory"] = {
                "source": "DATA_DERIVED",
                "valueUnits": round(latest_inv, 2),
                "formatted": f"{int(latest_inv):,} units",
                "reason": None,
            }
        else:
            result["workingInventory"] = {
                "source": "UNAVAILABLE",
                "valueUnits": None,
                "formatted": "UNAVAILABLE",
                "reason": "inventory column present but all values are null.",
            }
    else:
        result["workingInventory"] = {
            "source": "UNAVAILABLE",
            "valueUnits": None,
            "formatted": "UNAVAILABLE",
            "reason": "inventory column not found in dataset.",
        }

    # ── Real Price Baseline ──────────────────────────────────────────────────
    rev_m = m_engine.calculate_revenue()
    real_price: float | None = None
    price_reason: str | None = None
    if rev_m.available and rev_m.value and rev_m.value > 0:
        if "quantity" in df.columns and df["quantity"].dropna().sum() > 0:
            total_units = float(df["quantity"].dropna().sum())
            real_price = round(rev_m.value / total_units, 2)
        elif "unit_price" in df.columns and df["unit_price"].dropna().count() > 0:
            real_price = round(float(df["unit_price"].dropna().mean()), 2)
        else:
            price_reason = "No quantity or unit_price column found; cannot derive real price."
    else:
        price_reason = "Revenue column unavailable; cannot derive real price."

    if real_price is not None:
        result["realPriceBaseline"] = {
            "source": "DATA_DERIVED",
            "valueRupees": real_price,
            "formatted": format_currency_value(real_price, currency),
            "reason": None,
        }
    else:
        result["realPriceBaseline"] = {
            "source": "UNAVAILABLE",
            "valueRupees": None,
            "formatted": "UNAVAILABLE",
            "reason": price_reason,
        }

    # ── Operating Expense ────────────────────────────────────────────────────
    if "operating_expense" in df.columns and df["operating_expense"].dropna().count() > 0:
        opex_raw = float(df["operating_expense"].dropna().sum())
        result["operatingExpense"] = {
            "source": "DATA_DERIVED",
            "valueCr": round(opex_raw / scale, 4),
            "formatted": format_currency_value(opex_raw, currency),
            "reason": None,
        }
    else:
        result["operatingExpense"] = {
            "source": "UNAVAILABLE",
            "valueCr": None,
            "formatted": "UNAVAILABLE",
            "reason": "operating_expense column not found; operating margin is UNAVAILABLE.",
        }

    return result
