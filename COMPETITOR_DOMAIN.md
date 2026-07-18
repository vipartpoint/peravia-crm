# Competitor Domain

## 1. Competitor Model

### Fields
- `id` (String, UUID, Primary Key)
- `name` (String, Unique)
- `website` (String, optional)
- `notes` (String, optional)
- `isActive` (Boolean, default: true)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

## Purpose
The Competitor model serves as a centralized registry of known market competitors. Standardizing competitor identities prevents data fragmentation (e.g., "Brand X", "BrandX", "brand x") and enables accurate "Lost by Competitor" and "Win Rate vs Competitor" analytics.

## Integration with Opportunity
When an Opportunity is lost and the `LostReason` is `COMPETITOR`, the UI will prompt the sales user to select the specific `Competitor` from a dropdown menu.

- `competitorId` will link the Opportunity directly to the standardized entity.
- `competitorNote` will serve as an optional text field for any additional context regarding why the competitor won the deal.
