# SPANCOP Runtime Verification Checklist

**Status:** PENDING

---

## 1. Create a new Opportunity
- [ ] Verify default stage is `Suspect`.
- [ ] Verify default status is `Open`.

## 2. Stage Progression (Drag & Drop)
- [ ] Drag Opportunity through every SPANCOP stage: `Suspect` ➔ `Prospect` ➔ `Analysis` ➔ `Negotiate` ➔ `Close` ➔ `Order` ➔ `Payment`.
- [ ] Verify `StageChanged` Activity is created for every transition.
- [ ] Verify Stage History (Timeline) is recorded for every transition.

## 3. Mark as Lost
Mark an Opportunity as Lost while in each of the following stages: `Suspect`, `Prospect`, `Analysis`, `Negotiate`, `Close`, `Order`.
- [ ] Verify `salesStage` does NOT change (the card must remain in its current Kanban column).
- [ ] Verify `status` becomes `Lost`.
- [ ] Verify `lostReason` is mandatory to complete the action.
- [ ] Verify `lostAt` is recorded in the database.
- [ ] Verify `OpportunityLost` Activity is created.
- [ ] Verify Timeline is updated.

## 4. Reopen a Lost Opportunity
- [ ] Verify `status` changes from `Lost` to `Open`.
- [ ] Verify `salesStage` remains unchanged.
- [ ] Verify reopen reason is required (if applicable in UI).
- [ ] Verify `OpportunityReopened` Activity is created.
- [ ] Verify Timeline is updated.

## 5. Payment Verification (Won Constraints)
- [ ] Move Opportunity to `Payment` stage.
- [ ] Verify payment validation executes.
- [ ] Verify `status` automatically becomes `Won` only after successful payment confirmation.
- [ ] Verify manual `Won` assignment before `Payment` stage is rejected by the backend.

## 6. Kanban Verification
- [ ] Verify exactly seven columns exist: `Suspect`, `Prospect`, `Analysis`, `Negotiate`, `Close`, `Order`, `Payment`.
- [ ] Verify there is NO `Won` column.
- [ ] Verify there is NO `Lost` column.

## 7. Status Badge Verification
- [ ] Verify badges are correctly displayed on cards: `Open`, `Won`, `Lost`.
- [ ] Verify status changes (e.g., changing to Lost or Won) never move the card out of its SPANCOP stage column.

## 8. Filters Verification
- [ ] Verify Kanban Status Filters function correctly: `All`, `Open`, `Won`, `Lost`.

## 9. Dashboard Verification
- [ ] Verify every widget on the dashboard correctly uses SPANCOP stages instead of legacy stages.

## 10. Funnel Verification
- [ ] Verify the Sales Funnel contains exactly seven SPANCOP stages.
- [ ] Verify the Funnel groups active opportunities accurately by `salesStage`.

## 11. Reports Verification
Verify the following reports work with the new SPANCOP architecture:
- [ ] Lost by Stage
- [ ] Won by Stage
- [ ] Conversion Rate
- [ ] Stage Duration
- [ ] Revenue by Stage
- [ ] Drop-off Rate

## 12. Forecast Verification
- [ ] Verify `Lost` opportunities are EXCLUDED from active pipeline forecasts.
- [ ] Verify `Won` opportunities are counted correctly in revenue realization forecasts.

## 13. Database Verification
- [ ] Verify every Opportunity contains a valid `salesStage`.
- [ ] Verify every Opportunity contains a valid `status` (`Open`, `Won`, `Lost`).
- [ ] Verify there are no legacy stages (Lead, Qualified, Proposal, Negotiation) remaining in the `salesStage` field for active/valid records.

## 14. Regression Tests
- [ ] Verify no existing CRM functionality is broken (Customer management, Leads, Invoices, etc.).
