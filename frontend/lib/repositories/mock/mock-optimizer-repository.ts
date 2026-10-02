import type {
  OptimizerRepository,
  OptimizerRunRequest,
} from "../optimizer-repository";
import type {
  OptimizerWorkspaceData,
  OptimizerResultRow,
  RecommendedConfiguration,
  OptimizerSearchSummary,
  SavedOptimizerConfig,
} from "@/types/optimizer-workspace";
import {
  MOCK_OPTIMIZER_WORKSPACE,
  OPTIMIZER_RESULTS,
  OPTIMIZER_RECOMMENDATION,
  OPTIMIZER_SEARCH_SUMMARY,
} from "@/lib/mock-data/optimizer-workspace.mock";

export class MockOptimizerRepository implements OptimizerRepository {
  private workspace: OptimizerWorkspaceData = { ...MOCK_OPTIMIZER_WORKSPACE };
  private savedConfigs: SavedOptimizerConfig[] = [
    {
      id: "saved-1",
      name: "Q4 Base Profit Maximizer",
      createdAt: "2026-09-28T10:30:00Z",
      objective: "maximize_gross_profit",
      marketingBudget: "₹1.65 Cr",
      inventory: "1,050 units",
      unitPrice: "₹108",
      projectedProfit: "₹22.4 Cr",
    },
    {
      id: "saved-2",
      name: "Aggressive Top-line Growth",
      createdAt: "2026-09-25T14:15:00Z",
      objective: "maximize_revenue",
      marketingBudget: "₹1.85 Cr",
      inventory: "1,200 units",
      unitPrice: "₹102",
      projectedProfit: "₹20.8 Cr",
    },
  ];

  async getOptimizerWorkspace(): Promise<OptimizerWorkspaceData> {
    return { ...this.workspace };
  }

  async runOptimization(request: OptimizerRunRequest): Promise<{
    results: OptimizerResultRow[];
    recommendation: RecommendedConfiguration | null;
    summary: OptimizerSearchSummary;
  }> {
    if (request.objective === "maximize_revenue") {
      return {
        results: [
          {
            id: "cfg-rev-1",
            label: "Config R1 (Growth)",
            grossProfit: "₹21.2 Cr",
            grossProfitNum: 21.2,
            revenue: "₹56.8 Cr",
            revenueNum: 56.8,
            margin: "31.4%",
            marginNum: 31.4,
            budget: "₹1.85 Cr",
            budgetNum: 1.85,
            status: "recommended",
            rank: 1,
          },
          {
            id: "cfg-rev-2",
            label: "Config R2 (Balanced)",
            grossProfit: "₹21.9 Cr",
            grossProfitNum: 21.9,
            revenue: "₹54.2 Cr",
            revenueNum: 54.2,
            margin: "33.8%",
            marginNum: 33.8,
            budget: "₹1.70 Cr",
            budgetNum: 1.70,
            status: "feasible",
            rank: 2,
          },
          {
            id: "cfg-rev-3",
            label: "Config R3 (Conservative)",
            grossProfit: "₹19.8 Cr",
            grossProfitNum: 19.8,
            revenue: "₹50.1 Cr",
            revenueNum: 50.1,
            margin: "30.1%",
            marginNum: 30.1,
            budget: "₹1.92 Cr",
            budgetNum: 1.92,
            status: "suboptimal",
            rank: 3,
          },
        ],
        recommendation: {
          marketingBudget: "₹1.85 Cr",
          marketingBudgetNum: 18500000,
          workingInventory: "1,200 units",
          workingInventoryNum: 1200,
          unitPrice: "₹102",
          unitPriceNum: 102,
          projectedGrossProfit: "₹21.2 Cr",
          projectedRevenue: "₹56.8 Cr",
          projectedMargin: "31.4%",
          projectedMarginNum: 31.4,
          improvementVsCurrent: "+26.8% revenue vs. baseline",
        },
        summary: {
          ...OPTIMIZER_SEARCH_SUMMARY,
          bestConfigId: "cfg-rev-1",
          bestConfigLabel: "Config R1",
          bindingConstraint: "Budget ≤ ₹2.0 Cr",
        },
      };
    }

    if (request.objective === "maximize_operating_margin") {
      return {
        results: [
          {
            id: "cfg-mrg-1",
            label: "Config M1 (Premium)",
            grossProfit: "₹20.4 Cr",
            grossProfitNum: 20.4,
            revenue: "₹46.2 Cr",
            revenueNum: 46.2,
            margin: "38.2%",
            marginNum: 38.2,
            budget: "₹1.25 Cr",
            budgetNum: 1.25,
            status: "recommended",
            rank: 1,
          },
        ],
        recommendation: {
          marketingBudget: "₹1.25 Cr",
          marketingBudgetNum: 12500000,
          workingInventory: "800 units",
          workingInventoryNum: 800,
          unitPrice: "₹112",
          unitPriceNum: 112,
          projectedGrossProfit: "₹20.4 Cr",
          projectedRevenue: "₹46.2 Cr",
          projectedMargin: "38.2%",
          projectedMarginNum: 38.2,
          improvementVsCurrent: "+6.8 pp margin vs. baseline",
        },
        summary: {
          ...OPTIMIZER_SEARCH_SUMMARY,
          bestConfigId: "cfg-mrg-1",
          bestConfigLabel: "Config M1",
          bindingConstraint: "Customer Churn ≤ 3.5%",
        },
      };
    }

    if (request.objective === "minimize_inventory") {
      return {
        results: [
          {
            id: "cfg-inv-1",
            label: "Config J1 (Lean JIT)",
            grossProfit: "₹21.0 Cr",
            grossProfitNum: 21.0,
            revenue: "₹48.6 Cr",
            revenueNum: 48.6,
            margin: "35.0%",
            marginNum: 35.0,
            budget: "₹1.35 Cr",
            budgetNum: 1.35,
            status: "recommended",
            rank: 1,
          },
        ],
        recommendation: {
          marketingBudget: "₹1.35 Cr",
          marketingBudgetNum: 13500000,
          workingInventory: "650 units",
          workingInventoryNum: 650,
          unitPrice: "₹110",
          unitPriceNum: 110,
          projectedGrossProfit: "₹21.0 Cr",
          projectedRevenue: "₹48.6 Cr",
          projectedMargin: "35.0%",
          projectedMarginNum: 35.0,
          improvementVsCurrent: "-27.8% working capital in inventory",
        },
        summary: {
          ...OPTIMIZER_SEARCH_SUMMARY,
          bestConfigId: "cfg-inv-1",
          bestConfigLabel: "Config J1",
          bindingConstraint: "Service Fill Rate ≥ 95%",
        },
      };
    }

    return {
      results: OPTIMIZER_RESULTS,
      recommendation: OPTIMIZER_RECOMMENDATION,
      summary: OPTIMIZER_SEARCH_SUMMARY,
    };
  }

  async getSavedConfigurations(): Promise<SavedOptimizerConfig[]> {
    return [...this.savedConfigs];
  }

  async saveConfiguration(
    config: Omit<SavedOptimizerConfig, "id" | "createdAt">
  ): Promise<SavedOptimizerConfig> {
    const newConfig: SavedOptimizerConfig = {
      ...config,
      id: `saved-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.savedConfigs.unshift(newConfig);
    return { ...newConfig };
  }
}
