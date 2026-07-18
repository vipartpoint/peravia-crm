# Sales Intelligence Reconciliation Report

## Overview
1. **Total Opportunities scanned:** 5
2. **Total Opportunities migrated:** 5
3. **Total LostReason mappings:** 5
4. **Total ReopenReason mappings:** 8
5. **Total Competitor mappings:** 3
6. **Total OpportunityCompetitor records created:** 3
7. **Total Activity metadata enriched:** 8
8. **Total records mapped to OTHER:** 7 (Lost: 1, Reopen: 6)
9. **Total ambiguous records remaining:** 7
10. **Total migration failures:** 0

## Verification Results
11. **Duplicate detection results:** 0 duplicates found.
12. **Referential integrity verification:** Passed
13. **Orphan foreign key verification:** 0 orphans found.
14. **Idempotency verification:** Passed (2nd run yielded 0 new records)
15. **Legacy field preservation verification:** Passed (Legacy text fields untouched)

## Data Distributions
16. **Catalog counts after migration:**
    - LostReasons: 10
    - ReopenReasons: 7
    - Competitors: 3

17. **Opportunity counts by LostReason:**
- COMPETITOR: 1
- PRICE: 2
- OTHER: 1
- DELIVERY_TIME: 1

18. **Opportunity counts by Competitor:**
- Sepahan: 1
- Behran: 2

19. **Rollback verification:**
    - Safe to rollback: true (Legacy `lostReason` and `competitorName` columns still exist and contain original data)

20. **Final migration health summary:**
    - **Status:** HEALTHY - Production Ready
