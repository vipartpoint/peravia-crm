# SPANCOP Payment Stage Protection

## Overview
The `Payment` stage represents the final milestone in the SPANCOP pipeline. To ensure data integrity and prevent premature revenue recognition, strict guardrails have been implemented around the transition to this stage and the corresponding `Won` status.

## Business Rules Implemented

### 1. Payment Validation Gate
- Transitioning an Opportunity from `Order` (or any stage) to `Payment` triggers a mandatory backend validation.
- **Equivalent Business Validation:** The system queries the `Payment` table for any transaction associated with the Customer where `status = 'Confirmed'`.
- If no confirmed payment exists, the API rejects the transition with an `HTTP 409 Conflict`.
- **Result on Failure:** The Opportunity's `salesStage` and `status` remain completely unchanged, and no `Activity` or `StageHistory` records are generated.

### 2. Automatic Status Resolution
- If the payment validation succeeds, the `salesStage` is safely transitioned to `Payment`.
- Simultaneously, the backend automatically transitions the `status` to `Won`.
- Both `StageChanged` and `OpportunityWon` activities are generated.

### 3. Manual Assignment Restriction
- The API explicitly blocks manual assignment of `status = Won` unless the aforementioned payment validation passes.
- Furthermore, `status = Won` is hard-locked to the `Payment` stage. Attempts to manually mark an opportunity as `Won` while it resides in `Suspect`, `Prospect`, `Analysis`, `Negotiate`, `Close`, or `Order` will be rejected with an `HTTP 409 Conflict`.

## Execution Status
**IMPLEMENTED**: The logic has been embedded in `opportunities.service.ts`. 

You may now resume the Runtime Verification phase to test this rule.
