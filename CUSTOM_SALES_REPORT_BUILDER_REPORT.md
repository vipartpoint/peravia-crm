# Custom Sales Report Builder

## Overview
A powerful dynamic reporting engine has been implemented on the Sales Dashboard, strictly utilizing Live Data from the Peravia CRM backend, without replacing the existing automatic KPIs and charts.

## Frontend UI implementation
A new `<CustomSalesReportBuilder />` component is mounted directly below the automatic charts at `/opportunities/dashboard`.

**Features:**
- **Filters:** Includes all requested constraints: Date Range (Start/End), Salesperson, Territory, Stage, Status, Competitor, Lost Reason.
- **Quick Probability Filters:** Provided via an easy preset selector (0-25%, 25-50%, 50-75%, 75-100%).
- **Grouping Toggle:** Allows dynamic pivot tables and charts grouped by Stage, Product, Month, Salesperson, Territory, Customer, Competitor, or Lost Reason.
- **Chart Selection:** Includes dynamic Bar, Line, and Pie charts powered by `recharts`.
- **Raw Data Table:** Automatically generates a comprehensive table view of every opportunity matching the current filters.

## Backend Implementation
**Endpoint**: `POST /api/v1/opportunities/reports/custom`
**Logic (`opportunities.service.ts`)**: 
- Validates the incoming JSON payload.
- Dynamically constructs Prisma `where` objects to apply highly complex filter combinations.
- Calculates 9 distinct aggregated metrics, including the `Average Sales Cycle` (days elapsed between Lead creation and Won status).
- Enforces dynamic RBAC (Role-Based Access Control) to restrict data exposure according to user privileges.
