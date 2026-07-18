# Dashboard Refactor Plan

## 1. Funnel Metrics Adjustment
- **Strict SPANCOP Alignment**: The Sales Analytics funnel must represent the 7 canonical stages. 'Won' and 'Lost' are no longer stages, preventing distortion in funnel charts.
- **Lost Attribution**: The funnel can now accurately show where drop-offs occurred because a lost opportunity retains its `salesStage`. Drop-offs per stage can be visually rendered.

## 2. Active Forecasting
- `Open` status opportunities feed into the active pipeline forecast.
- `Lost` opportunities are explicitly excluded from the current pipeline totals and weighted pipeline metrics.
- `Won` opportunities represent realized revenue and should be split into a separate "Realized Revenue" indicator on the dashboard rather than mixed into active open pipeline stages.

## 3. Top-Level KPIs
- Updates to top-level KPI metrics to query based on `status = 'Open'` (active pipeline), `status = 'Won'` (converted), and `status = 'Lost'` (churn).
