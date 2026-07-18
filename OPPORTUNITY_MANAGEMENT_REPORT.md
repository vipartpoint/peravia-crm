# Opportunity Management Report

## Workflows

### Lead Conversion
Instead of manually creating Opportunities from scratch, Sales users can select "Convert to Opportunity" when a Lead is marked as "Qualified". This carries over the `territoryId`, `ownerId`, and history references.

### Multi-Product Deals
An Opportunity can consist of multiple `OpportunityItem` entries. The service layer dynamically calculates `totalEstimatedValue` and `totalPotentialVolume` across all items upon any creation or modification.

### Convert to Order
The system replaces automatic Order creation with a "Create Order From Opportunity" endpoint (`/convert-to-order`). This provides a pre-filled draft payload to the UI, allowing the user to make final adjustments to pricing, discounts, and payment terms before hitting the Finance Engine.

### Competitor Tracking
To aid in Loss analytics, competitor fields (`competitorName`, `competitorNotes`) are strictly integrated into the core Opportunity model.
