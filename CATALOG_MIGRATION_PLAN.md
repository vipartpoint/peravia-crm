# Catalog Migration Plan

## 1. Schema Expansion
- Run `prisma db push` (or create a migration) introducing `LostReason`, `ReopenReason`, and `Competitor` models.
- Add nullable foreign keys `lostReasonId`, `reopenReasonId`, and `competitorId` to the `Opportunity` model.
- Keep existing `lostReason`, `competitorName`, and `competitorNotes` string fields in the database temporarily.

## 2. Default Seed Script
Create a migration seed script `seed_catalogs.ts` to populate:
- 10 standard `LostReason` records (e.g., PRICE, COMPETITOR, OTHER).
- 7 standard `ReopenReason` records (e.g., CUSTOMER_RETURNED, OTHER).

## 3. Data Backfill & Normalization
- Map existing `lostReason` text to the newly seeded `OTHER` lost reason entity by default, while copying the existing text into `lostReasonNote`.
- Map existing `competitorName` text to `competitorNote` and set `lostReasonId` to the `COMPETITOR` ID (if a competitor name exists).
- If distinct competitor names repeat frequently in the database, optionally seed them as new `Competitor` entities and map `competitorId` accordingly.

## 4. Column Renaming / Cleanup
- After backfilling, the legacy `lostReason` string column will officially act as `lostReasonNote`.
- The legacy `competitorName` string column will officially act as `competitorNote`.

## 5. Deployment Safety
This migration strategy is purely additive and non-destructive. Rollbacks can be executed gracefully without losing existing textual context.
