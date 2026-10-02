"""DecisionOS — routes package."""
from app.routes.health import router as health_router
from app.routes.auth import router as auth_router
from app.routes.business import router as business_router
from app.routes.digital_twin import router as digital_twin_router
from app.routes.dashboard import router as dashboard_router

from app.routes.opportunities import router as opportunities_router
from app.routes.investigations import router as investigations_router
from app.routes.replay import router as replay_router
from app.routes.scenarios import router as scenarios_router
from app.routes.optimizer import router as optimizer_router
from app.routes.decisions import router as decisions_router
from app.routes.decision_dna import router as decision_dna_router

__all__ = [
    "health_router",
    "auth_router",
    "business_router",
    "digital_twin_router",
    "dashboard_router",
    "opportunities_router",
    "investigations_router",
    "replay_router",
    "scenarios_router",
    "optimizer_router",
    "decisions_router",
    "decision_dna_router",
]
