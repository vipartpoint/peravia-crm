# Win / Loss Analytics Report

## Requirements & Triggers
When an Opportunity transitions to a `Lost` status, the system enforces a strict validation rule requiring the `lostReason` field. Without it, the API will reject the update with a `400 BadRequestException`.

## Supported Reasons (Standardized)
- Price
- Competitor
- Delivery Time
- Product Availability
- Customer Cancelled
- Other

## Competitive Tracking
The inclusion of `competitorName` and `competitorNotes` allows management to group lost deals by specific market competitors (e.g., Behran, Sepahan). 
This allows the Marketing and Pricing teams to adjust strategy based on exact competitor wins vs losses.
