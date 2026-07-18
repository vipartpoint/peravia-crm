# Enterprise Sales Pipeline Architecture

## Overview
The Enterprise Sales Pipeline module transforms the standard Lead -> Order flow into a professional, enterprise-grade Opportunity Management system.

## Database Schema Design
- **Opportunity**: Links `ownerId`, `territoryId`, `leadId`, and `customerId`. Contains high-level aggregated data such as `totalEstimatedValue` and `totalPotentialVolume`. Tracks competitor details.
- **OpportunityItem**: Supports multi-product deals (similar to OrderItems).
- **OpportunityStageConfig**: SystemAdmin configurable stages and base probabilities.
- **OpportunityStageHistory**: Audit trail of stage durations for velocity reporting.

## NestJS Backend Implementation
- **Module**: `OpportunitiesModule` isolated from Inventory and Finance.
- **RBAC**: Implemented at controller and service layers. Sales users can only access their owned opportunities.
- **API**: Full CRUD + `/dashboard/forecast` analytics aggregation endpoint.

## Next.js Frontend Implementation
- **Routing**: `/(dashboard)/opportunities` with sub-routes for kanban, table, details, and dashboard views.
- **Sidebar Integration**: Placed prominently under the Sales category using a `TrendingUp` icon.
