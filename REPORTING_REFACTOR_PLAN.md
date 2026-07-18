# Reporting Refactor Plan

## 1. Win/Loss Analytics
- **Loss by Stage**: Generate reports that group `status = 'Lost'` opportunities by their current `salesStage`. This identifies which phase of the sales cycle needs process improvement.
- **Loss Reasons**: Aggregate `lostReason` fields for root-cause analysis, mapped against competitors using `competitorName`.

## 2. Velocity and Conversion Metrics
- **Stage Duration**: Time spent in each of the 7 stages (irrespective of outcome) continues to be accurately tracked.
- **Conversion Rate per Stage**: Calculated by comparing opportunities moving forward vs. opportunities marked `Lost` within that exact stage.
- **Payment Completion Rate**: Tracking the success rate of closing a deal once it enters the `Payment` stage vs falling out at the last minute.

## 3. Historical View
- Lost opportunities remain accessible in historical views and reports via a global status filter, rather than disappearing from their corresponding process columns.
