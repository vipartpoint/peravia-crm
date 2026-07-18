# Sales Intelligence Runtime Verification Checklist

## 1. Catalog Management
- [ ] Verify `GET /api/v1/catalogs/lost-reasons` returns active lost reasons, ordered correctly.
- [ ] Verify `GET /api/v1/catalogs/reopen-reasons` returns active reopen reasons, ordered correctly.
- [ ] Verify `GET /api/v1/catalogs/competitors` returns active competitors.

## 2. Opportunity Lost Transition
- [ ] Mark Opportunity as Lost without providing `lostReasonId`. Verify `HTTP 400 Bad Request`.
- [ ] Mark Opportunity as Lost providing `lostReasonId` but no `competitors`. Verify `HTTP 200 OK`.
- [ ] Verify `lostReasonId`, `lostReasonNote`, `lostById`, and `lostAt` are saved correctly in the Opportunity database record.
- [ ] Verify `Activity` of type `OpportunityLost` is created, and its `metadata` contains `lostReasonId` and `lostReasonCode`.
- [ ] Verify `OpportunityCompetitor` relations are created if `competitors` array is provided in the payload.

## 3. Opportunity Reopen Transition
- [ ] Reopen a Lost Opportunity without providing `reopenReasonId`. Verify `HTTP 400 Bad Request`.
- [ ] Reopen a Lost Opportunity providing a valid `reopenReasonId`. Verify `HTTP 200 OK`.
- [ ] Verify `reopenedById` and `reopenedAt` are saved correctly in the Opportunity database record.
- [ ] Verify `Activity` of type `OpportunityReopened` is created, and its `metadata` contains `reopenReasonId` and `reopenReasonCode`.

## 4. UI / Frontend Verification
- [ ] Verify Lost/Reopen modals display dropdowns loaded from the Catalogs API.
- [ ] Verify "Other" selection conditionally reveals the Note text area.
- [ ] Verify Competitor selection allows choosing known competitors.
- [ ] Verify Dashboard analytics group by `code` instead of local strings.
