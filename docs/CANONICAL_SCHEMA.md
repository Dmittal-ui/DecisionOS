# DecisionOS — Canonical Business Schema Specification

## 1. Overview

DecisionOS ingests heterogeneous business data files (CSV, XLSX, JSON) across multi-channel retail, e-commerce, and direct-to-consumer businesses without requiring proprietary or hardcoded column headers.

The ingestion engine automatically maps client column headers to the **Canonical Business Schema** using alias matching and normalization. If client files use custom headers, DecisionOS maps them flexibly while rejecting invalid values and missing mandatory domains.

---

## 2. Canonical Field Dictionary

| Canonical Field | Data Type | Common Aliases / Synonyms | Required / Optional | Usage in Digital Twin |
| :--- | :--- | :--- | :--- | :--- |
| **`date`** | `datetime` (ISO 8601) | `date`, `sale_date`, `order_date`, `timestamp`, `transaction_date`, `day`, `created_at`, `time` | Highly Recommended | Time-series trends, period start/end detection |
| **`order_id`** | `string` | `order_id`, `order_number`, `transaction_id`, `order_code`, `id`, `order`, `invoice_no` | Recommended | Order volume calculation, unique transaction counting |
| **`customer_id`** | `string` | `customer_id`, `cust_id`, `client_id`, `user_id`, `buyer_id`, `account_id` | Optional | Customer counts, repeat purchase rate, CAC |
| **`product_id`** | `string` | `product_id`, `sku`, `item_id`, `product_code`, `product`, `item_name` | Optional | Product-level granularity, inventory reconciliation |
| **`channel`** | `string` | `channel`, `sales_channel`, `source`, `platform`, `acquisition_channel`, `store` | Optional | Multi-channel attribution (Amazon, Shopify, QuickCommerce, etc.) |
| **`revenue`** | `float` (>= 0) | `revenue`, `total_sales`, `sales`, `gross_sales`, `turnover`, `total_amount`, `amount`, `selling_price` | Core Metric | Primary revenue metric, operating margin calculation |
| **`quantity`** | `float` / `int` (>= 0) | `quantity`, `qty`, `units`, `units_sold`, `volume`, `count`, `item_count` | Core Metric | Order volume, unit sales velocity |
| **`cost`** | `float` (>= 0) | `cost`, `cogs`, `product_cost`, `unit_cost`, `total_cost`, `cost_of_goods_sold`, `expense` | Core Metric | Gross profit calculation (`revenue - cost`) |
| **`marketing_spend`**| `float` (>= 0) | `marketing_spend`, `ad_spend`, `spend`, `marketing_cost`, `advertising`, `campaign_cost` | Optional | CAC calculation, marketing efficiency |
| **`visitors`** | `int` (>= 0) | `visitors`, `traffic`, `sessions`, `impressions`, `clicks`, `users`, `pageviews` | Optional | Conversion rate calculation (`orders / visitors`) |
| **`inventory`** | `float` / `int` (>= 0) | `inventory`, `stock`, `stock_level`, `available_stock`, `on_hand`, `working_inventory` | Optional | Working inventory level, supply resilience |
| **`operating_expense`**| `float` (>= 0) | `operating_expense`, `opex`, `overhead`, `operating_cost`, `fulfillment_cost`, `shipping_cost` | Optional | Operating margin calculation |

---

## 3. Digital Twin Metric Derivations & Fallback Rules

DecisionOS never fabricates missing data. When an input dataset lacks the fields needed to compute a metric, the metric's state is returned as `available = false` with an explanatory reason.

| Digital Twin Metric | Derivation Formula | Required Canonical Fields | Fallback When Missing |
| :--- | :--- | :--- | :--- |
| **Revenue** | `sum(revenue)` or `sum(quantity * unit_price)` | `revenue` OR (`quantity` AND `price`) | `available = false` ("No revenue or price column found") |
| **Gross Profit** | `sum(revenue) - sum(cost)` | `revenue` AND `cost` | `available = false` ("Cost/COGS data not present in dataset") |
| **Orders** | `count_distinct(order_id)` or `count(rows)` | `order_id` OR record count | Defaults to total valid transaction rows |
| **Inventory** | `sum(inventory)` or latest stock reading | `inventory` | `available = false` ("Inventory / stock levels not present in dataset") |
| **Marketing Spend** | `sum(marketing_spend)` | `marketing_spend` | `available = false` ("Marketing / ad spend data not present in dataset") |
| **Conversion Rate** | `(orders / visitors) * 100` | `visitors` AND `orders` | `available = false` ("Traffic/visitor data not present in dataset") |
| **CAC** | `marketing_spend / unique_customers` | `marketing_spend` AND `customer_id` | `available = false` ("Requires marketing spend and customer data") |
| **Operating Margin**| `((gross_profit - opex) / revenue) * 100` | `revenue`, `cost`, `operating_expense` | `available = false` ("Requires revenue, cost, and operating expense data") |

---

## 4. Validation Rules

1. **Empty Datasets**: 0 rows or empty files are rejected with `400 Bad Request`.
2. **Missing Core Domains**: Datasets must contain at least one recognized commercial signal (`revenue`, `cost`, `quantity`, or `date`). Files with no recognizable business columns are rejected.
3. **Invalid Dates**: Non-parseable date strings are counted and flagged in the validation report; valid dates are coerced to UTC.
4. **Invalid Numeric Values**: Negative quantities or non-numeric strings in financial columns are coerced or flagged; invalid rows are excluded from calculation and logged.
5. **Duplicate Records**: Exact row duplicates or conflicting transactions are reported in `validationSummary`.
6. **No Data Fabrication**: Missing values are NOT filled with arbitrary mock constants.
