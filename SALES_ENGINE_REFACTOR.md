# SPANCOP Sales Engine Refactor

## Executive Summary
This document outlines the final business rules and core engine adjustments for the SPANCOP sales pipeline. The engine must decouple the opportunity's linear sales stage from its outcome status, ensuring accurate funnel tracking, drop-off analysis, and strict adherence to the SPANCOP methodology.

## 1. Core Principles
1. **Separation of Concerns**: `salesStage` (where the opportunity is in the process) is strictly independent of `status` (Open, Won, Lost).
2. **Immutability of Position on Loss**: Changing status to Lost or Won NEVER moves the card to a different column or a pseudo-stage.
3. **English Canonical Identifiers**: The seven canonical stages (Suspect, Prospect, Analysis, Negotiate, Close, Order, Payment) are fixed, English constants across backend and database.

## 2. Business Rules Enforcement
- **Open Status**: Opportunities begin as `Open`. An `Open` opportunity can exist in any stage EXCEPT `Payment` (if it implies immediate closure, though it can remain Open pending confirmation). 
- **Lost Status**: A `Lost` opportunity can exist in ANY stage. When marked Lost, it requires a `lostReason`, captures `lostAt`, and allows `competitorName`. It is excluded from active pipeline forecasting.
- **Won Status**: `Won` can ONLY be assigned when an opportunity has reached the `Payment` stage and payment is confirmed.
- **Drag & Drop**: Moving a card across Kanban columns updates `salesStage` only. It does not update `status` implicitly, except for final `Payment` constraints.

## 3. Reopening Opportunities
A Lost opportunity cannot be dragged forward unless explicitly reopened. Reopening:
- Sets status back to `Open`
- Retains the exact `salesStage`
- Requires a reopening reason
- Logs an activity

## 4. Analytical Impact
The separation ensures that drop-off rates can be calculated precisely per stage. A "Lost in Negotiate" maintains `salesStage="Negotiate"` and `status="Lost"`, providing critical visibility into funnel bottlenecks.
