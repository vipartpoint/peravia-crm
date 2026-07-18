# Sales Forecasting Engine

## Mechanism

The forecasting engine applies weighted probability mathematics against real-time sales pipelines without impacting existing Production or Inventory modules.

### Formulae
- **Total Pipeline Value** = Sum of `totalEstimatedValue` across all "Open" Opportunities.
- **Weighted Forecast Value** = Sum of (`totalEstimatedValue` * (`probability` / 100)).
- **Win Rate** = `Won Count` / (`Won Count` + `Lost Count`).
- **Loss Rate** = `Lost Count` / (`Won Count` + `Lost Count`).

### Aggregation Layer
The aggregation is performed via `getDashboardForecast()` within `opportunities.service.ts`, iterating through items and grouping them cleanly by status, stage, and territory.

### Product Demand Projection
The forecasting engine tracks `potentialVolume` mapped by `productId`. This provides raw data for future integrations with the Production Planning module, allowing management to see early signals of demand per product variant (e.g., 20W50 vs 10W40).
