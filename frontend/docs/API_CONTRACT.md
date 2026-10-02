# DecisionOS — REST API & Decision Engine Contract Specification

**Version:** 1.0.0  
**Authors:** Person A (Senior Frontend Engineer)  
**Target Consumer:** Person B (Backend Engineer — FastAPI / Python / MongoDB / Deterministic Decision Engine)  
**Base URL:** `http://localhost:8000/api/v1`

---

## 1. Global Conventions

### 1.1 HTTP Headers
- `Content-Type: application/json`
- `Accept: application/json`
- `Authorization: Bearer <JWT_TOKEN>` (Enterprise RBAC)
- `X-Workspace-Id: <WORKSPACE_UUID>` (Multi-tenant partition)

### 1.2 Standard Success Response Envelope
All endpoints return standard JSON responses conforming to the generic `ApiResponse<T>` interface:

```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_01HJ8Z9V5K3X7B2Q1A9W0M4E5C",
    "timestamp": "2026-09-29T20:30:00.000Z",
    "version": "1.0.0",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 142,
      "totalPages": 8
    }
  }
}
```

### 1.3 Standard Error Response Envelope
```json
{
  "error": {
    "code": "CONSTRAINT_BREACHED",
    "message": "Optimization configuration violates hard working inventory floor.",
    "details": {
      "constraintId": "const_inv_floor",
      "limit": 500,
      "attempted": 420
    },
    "requestId": "req_01HJ8Z9V5K3X7B2Q1A9W0M4E5C"
  }
}
```

Standard Status Codes:
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created (e.g. decision approved/saved).
- `400 Bad Request`: Validation error or invalid parameter formatting.
- `401 Unauthorized`: Missing or invalid JWT.
- `403 Forbidden`: Role lacks required permission (e.g., CSOO approval rights).
- `404 Not Found`: Resource ID does not exist.
- `422 Unprocessable Entity`: Business constraint breach or mathematical infeasibility in engine.
- `500 Internal Server Error`: Unhandled engine exception.

---

## 2. Executive Dashboard Endpoints

### `GET /api/v1/dashboard/summary`
Returns executive high-level KPIs, opportunity counts, health indices, and quick-action summaries.

#### Response Body (`200 OK`)
```json
{
  "data": {
    "executiveMetrics": {
      "activeOpportunitiesCount": 24,
      "unrealizedValueTotal": 48200000,
      "realizedValueYTD": 128400000,
      "systemConfidenceAvg": 89.4,
      "criticalAlertsCount": 3
    },
    "businessHealthIndex": {
      "overallScore": 91.2,
      "revenueEfficiency": 88.5,
      "supplyChainResilience": 94.0,
      "pricingLeverage": 91.1
    },
    "recentDecisions": [
      {
        "id": "dec_01",
        "code": "DEC-2026-MKT-018",
        "title": "Marketing Channel Budget Reallocation",
        "status": "approved",
        "netImpact": "₹2.4 Cr",
        "approvedAt": "2026-09-28T14:30:00Z"
      }
    ]
  }
}
```

---

## 3. Opportunity Center Endpoints

### `GET /api/v1/opportunities`
Query continuous radar scan opportunities with filtering and sorting.

#### Query Parameters
- `status` (optional): `open` | `investigating` | `in_lab` | `decision_ready` | `resolved` | `dismissed`
- `urgency` (optional): `critical` | `high` | `medium` | `low`
- `category` (optional): `revenue` | `inventory` | `pricing` | `cost` | `customer`
- `search` (optional): Free text search across title, code, summary.
- `sortBy` (optional): `impact` | `confidence` | `urgency` | `detectedAt`
- `sortDir` (optional): `asc` | `desc`

#### Response Body (`200 OK`)
```json
{
  "data": [
    {
      "id": "opp_1",
      "code": "OPP-9021",
      "title": "Tier-2 Inbound Channel Revenue Efficiency Degradation",
      "category": "revenue",
      "urgency": "critical",
      "status": "investigating",
      "detectedAt": "2026-09-29T08:15:00Z",
      "summary": "CAC increased 14.1% while conversion dropped 8.2% in Tier-2 paid digital channels over the last 60 days.",
      "impact": {
        "netValue": 24000000,
        "netValueFormatted": "₹2.4 Cr",
        "confidenceScore": 88,
        "timeHorizon": "14 days",
        "riskLevel": "medium"
      }
    }
  ]
}
```

### `GET /api/v1/opportunities/{id}`
Returns granular metadata, evidence signals, and root-cause links for an opportunity.

### `POST /api/v1/opportunities/scan`
Triggers an on-demand algorithmic radar scan across enterprise data connectors.

---

## 4. Investigation & Decision Tree Endpoints

### `GET /api/v1/investigation/{opportunityCode}`
Returns the active investigation workspace, competing hypotheses, Bayesian confidence weights, causal graph, and decision tree root node.

#### Response Body (`200 OK`)
```json
{
  "data": {
    "id": "inv_9021",
    "opportunityCode": "OPP-9021",
    "overallConfidence": 88,
    "leadingHypothesisId": "hyp_1",
    "hypotheses": [
      {
        "id": "hyp_1",
        "rank": 1,
        "title": "Ad Spend Inefficiency in Paid Search & Social",
        "statement": "Bidding algorithm shifted spend into low-intent keyword clusters without negative keyword coverage.",
        "confidenceScore": 68,
        "evidenceCount": 4,
        "status": "leading"
      }
    ],
    "treeRoot": {
      "id": "node_root",
      "label": "Opportunity OPP-9021 Detected",
      "type": "root",
      "children": [
        {
          "id": "node_channel",
          "label": "Channel Performance Divergence",
          "type": "decision",
          "hypothesisId": "hyp_1"
        }
      ]
    },
    "timeline": [
      {
        "id": "evt_1",
        "timestamp": "2026-09-29T08:15:00Z",
        "title": "Radar Anomaly Flagged",
        "severity": "critical"
      }
    ]
  }
}
```

---

## 5. Decision Replay Endpoints

### `GET /api/v1/replay/historical-decisions`
Returns past decisions that have empirical baseline outcome telemetry.

### `GET /api/v1/replay/workspace/{decisionId}`
Returns actual trajectory vs counterfactual trajectory, timeline fork markers, outcome delta metrics, and empirical progression logs.

### `POST /api/v1/replay/simulate`
#### Request Body
```json
{
  "decisionId": "hist_dec_1",
  "branchId": "branch_reallocate"
}
```

---

## 6. Scenario Lab Simulation Endpoints

### `GET /api/v1/scenario/presets`
Returns predefined business levers (Growth Push, Conservative Cash Buffer, Margin Defense, Baseline).

### `POST /api/v1/scenario/simulate`
Runs the deterministic simulation engine on adjustable business levers.

#### Request Body
```json
{
  "presetId": "preset_growth",
  "levers": {
    "marketingBudget": 1.85,
    "workingInventory": 1300,
    "unitPrice": 102
  }
}
```

#### Response Body (`200 OK`)
```json
{
  "data": {
    "presetId": "preset_growth",
    "scenarioName": "Growth Push Simulation",
    "lastSimulatedAt": "2026-09-29T20:30:00Z",
    "levers": {
      "marketingBudget": 1.85,
      "workingInventory": 1300,
      "unitPrice": 102
    },
    "metrics": [
      {
        "key": "gross_revenue",
        "label": "Projected Gross Revenue",
        "currentValue": "₹44.8 Cr",
        "simulatedValue": "₹56.8 Cr",
        "change": "+₹12.0 Cr (+26.8%)",
        "changeType": "positive",
        "currentNum": 44.8,
        "simulatedNum": 56.8,
        "unit": "₹ Cr"
      }
    ],
    "sensitivity": [
      {
        "leverKey": "unitPrice",
        "leverLabel": "Unit Price",
        "sensitivityLevel": "High",
        "impactScore": 8.4,
        "barFillPercent": 84,
        "explanation": "Elasticity is highest between ₹100 and ₹108."
      }
    ],
    "constraints": [
      {
        "id": "const_1",
        "name": "Working Capital Cap",
        "rule": "Total allocated capital ≤ ₹3.5 Cr",
        "thresholdValue": "₹3.5 Cr",
        "projectedValue": "₹3.15 Cr",
        "status": "within_constraint",
        "statusLabel": "Feasible (₹0.35 Cr Headroom)"
      }
    ]
  }
}
```

### `POST /api/v1/scenario/save`
Saves a configured scenario run to user’s persistent registry.

---

## 7. Constraint-Aware Optimizer Endpoints

### `POST /api/v1/optimizer/solve`
Invokes the deterministic constraint-aware mathematical solver.

#### Request Body
```json
{
  "objective": "maximize_gross_profit",
  "hardConstraints": {
    "maxMarketingBudget": 2.0,
    "minInventory": 500,
    "maxInventory": 1500,
    "minMarginPercent": 30.0
  }
}
```

#### Response Body (`200 OK`)
```json
{
  "data": {
    "results": [
      {
        "id": "cfg-opt-1",
        "label": "Config 1 (Optimal)",
        "grossProfit": "₹22.4 Cr",
        "grossProfitNum": 22.4,
        "revenue": "₹52.4 Cr",
        "revenueNum": 52.4,
        "margin": "35.2%",
        "marginNum": 35.2,
        "budget": "₹1.65 Cr",
        "budgetNum": 1.65,
        "status": "recommended",
        "rank": 1
      }
    ],
    "recommendation": {
      "marketingBudget": "₹1.65 Cr",
      "marketingBudgetNum": 16500000,
      "workingInventory": "1,050 units",
      "workingInventoryNum": 1050,
      "unitPrice": "₹108",
      "unitPriceNum": 108,
      "projectedGrossProfit": "₹22.4 Cr",
      "projectedRevenue": "₹52.4 Cr",
      "projectedMargin": "35.2%",
      "projectedMarginNum": 35.2,
      "improvementVsCurrent": "+18.2% profit vs. baseline"
    },
    "summary": {
      "totalConfigurationsEvaluated": 1284,
      "feasibleConfigurations": 142,
      "infeasibleConfigurations": 1142,
      "optimalConfigId": "cfg-opt-1",
      "solverDurationMs": 42
    }
  }
}
```

---

## 8. Decision Registry & Human Approval Endpoints

### `GET /api/v1/decisions`
Fetches governance items with audit timelines and state tracking.

### `POST /api/v1/decisions/{id}/approve`
Human approval action by authorized stakeholder.

#### Request Body
```json
{
  "approverName": "Alexandra Chen",
  "approverRole": "Chief Strategy & Operating Officer (CSOO)",
  "notes": "Approved without modification based on Q3 optimizer convergence."
}
```

### `POST /api/v1/decisions/{id}/modify`
Human override of decision configuration variables.

#### Request Body
```json
{
  "modifiedBy": "Alexandra Chen",
  "marketingBudget": "₹1.50 Cr",
  "workingInventory": "1,100 units",
  "unitPrice": "₹106",
  "justification": "Conservative buffer required due to regional port congestion in West zone."
}
```

### `POST /api/v1/decisions/{id}/reject`
Rejects proposed decision configuration.

---

## 9. Decision DNA (Persistent Audit Lineage) Endpoints

### `GET /api/v1/decision-dna`
Returns immutable auditable decision packages tracing Problem Trigger → Investigation Root Cause → Counterfactual Alternatives → Optimization Constraints → Human Action → Empirical Outcome → Continuous System Learning.

### `GET /api/v1/decision-dna/{id}`
Returns complete DNA record with provenance cryptographic SHA-256 hash and actor lineage.
