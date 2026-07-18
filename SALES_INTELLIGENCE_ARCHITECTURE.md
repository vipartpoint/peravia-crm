# Sales Intelligence Layer Architecture

## Objective
Standardize analytical data in the SPANCOP pipeline by replacing free-text fields with normalized catalog entities (`LostReason`, `ReopenReason`, and `Competitor`). This shift ensures data integrity, unlocks advanced BI reporting, and lays the groundwork for AI-driven recommendations.

## Architectural Changes

### 1. Database Schema Additions
Four new models will be introduced:
- `LostReason`: Standardized reasons for an Opportunity being lost.
- `ReopenReason`: Standardized reasons for reopening a previously lost Opportunity.
- `Competitor`: Known competitors in the market.
- `OpportunityCompetitor`: A junction table enabling many-to-many relationship between Opportunities and Competitors (fields: `id`, `opportunityId`, `competitorId`, `isPrimary`, `note`, `createdAt`).

**Catalog Entity Structure:**
All catalog entities will share a standard structure:
`id`, `code`, `nameFa`, `nameEn`, `description`, `isActive`, `sortOrder`, `isSystem`, `createdAt`, `updatedAt`.
System records (`isSystem: true`) are immutable and cannot be deleted.

**Opportunity Schema Modifications:**
To preserve data and enable robust auditing, existing columns (`lostReason`, `competitorName`) will NOT be repurposed or deleted. They remain purely for migration.
Instead, we will add new dedicated fields:
- `lostReasonId` (FK to `LostReason`)
- `lostReasonNote` (String, Optional)
- `lostById` (String, Optional)
- `lostAt` (DateTime, already exists)
- `reopenReasonId` (FK to `ReopenReason`)
- `reopenReasonNote` (String, Optional)
- `reopenedById` (String, Optional)
- `reopenedAt` (DateTime, Optional)

### 2. API & Service Layer
- **New Endpoints:** CRUD operations for `LostReason`, `ReopenReason`, and `Competitor` protected by Administrator roles.
- **Opportunity Service Update:** Validation rules will enforce mandatory selection of `lostReasonId` and `reopenReasonId` when transitioning states, and record auditing metadata (`lostById`, `reopenedById`, etc.).

### 3. Frontend & UI
- Text fields for reasons and competitors will be replaced with searchable select dropdowns querying the catalog APIs.
- When a user selects "OTHER" from a catalog, a secondary text input (`Note`) will appear.
- While the UI may initially present a single competitor selection, the underlying API and database will support multiple competitors via the `OpportunityCompetitor` relation.

### 4. Reporting & Future AI
- **Immutable Codes:** All business logic and BI dashboards will aggregate by the immutable system `code` (e.g., `PRICE`), never by localized string names (`nameFa` or `nameEn`). Localization is strictly a frontend concern.
- **Analytics:** Dashboards will generate insights such as Top Lost Reasons, Top Competitors, and Competitor Win Rates, based entirely on the normalized catalog IDs and codes.
