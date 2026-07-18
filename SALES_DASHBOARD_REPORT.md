# Sales Dashboard Report

## KPIs (Key Performance Indicators)
The newly introduced Sales Dashboard aggregates data securely based on RBAC visibility:
- **Total Pipeline Value**: 100% of all potential deals.
- **Forecast Value**: Probability-weighted values.
- **Win Rate / Loss Rate**: Conversion analytics.

## UI Visualizations
1. **Pipeline Funnel**: Maps opportunities sequentially across `Lead -> Qualified -> Proposal -> Negotiation -> Won`.
2. **Forecast Trend Bar Chart**: Future expected values broken down by Territory.
3. **Lost Reason Pie Chart**: Instantly visible distribution of why deals are lost.
4. **Demand Forecast Table**: A grouped breakdown of requested Volumes per Product variant.

## User Flow
The Dashboard acts as the primary landing zone under the `Sales -> Opportunities` menu. It utilizes real-time API integrations (`GET /opportunities/dashboard/forecast`) ensuring no data caching latency.
