# Sales Dashboard Error Analysis

## Problem Report
During the QA verification of the `/opportunities/dashboard` UI, the component failed with the error: **"خطا در دریافت اطلاعات داشبورد"** and rendered no mock data, leaving the dashboard empty.

## Investigation & Root Causes

### 1. Endpoint Unavailability (HTTP 404)
A `curl -v http://localhost:3000/api/v1/opportunities/dashboard/forecast` request was made directly to the backend.
- **Failing Endpoint**: `GET /api/v1/opportunities/dashboard/forecast`
- **Error Received**: `Cannot GET /api/v1/opportunities/dashboard/forecast` (404 Not Found)
- **Root Cause**: While the `OpportunitiesModule` and its controllers were correctly implemented in Stage 11.6, the `OpportunitiesModule` was **omitted from the global `app.module.ts` imports array**. As a result, the NestJS routing engine ignored the entire controller.

### 2. Payload Mismatch
Once the module was imported, the endpoint became active. However, upon inspecting the JSON structure returned by the controller, a second issue was discovered.
- **Root Cause**: The `OpportunitiesService.getDashboardForecast` method was returning a structurally invalid payload compared to what the frontend `Recharts` implementation expected.
- **Expected by Frontend**: `{ pipelineValue, weightedForecast, winLoss, openCount, byStage, productDemand }`
- **Returned by Backend**: `{ kpis: {...}, stages: [] }` (an outdated DTO format).

## Resolution
1. **AppModule Updated**: Added `import { OpportunitiesModule } from './opportunities/opportunities.module';` to `backend/src/app.module.ts`.
2. **Service Refactored**: Rewrote `getDashboardForecast()` in `opportunities.service.ts` to exactly map the dynamic values expected by the frontend UI, resolving the rendering crash on the Dashboard page.
