# Activity Engine Alignment

## 1. Event Tracking on Status Change
- When an opportunity transitions to `status = 'Lost'`, the Activity engine must automatically generate an event (e.g. `OPPORTUNITY_LOST`).
- The event must log the `lostReason`, `competitorName`, and the `salesStage` in which the loss occurred.

## 2. Reopen Activity
- When a `Lost` opportunity is restored to `Open`, an `OPPORTUNITY_REOPENED` activity must be logged to the timeline.
- The reason for reopening must be recorded as part of the activity metadata.

## 3. Win Event
- The transition to `status = 'Won'` must generate an `OPPORTUNITY_WON` activity. This is strictly linked to fulfilling the `Payment` stage requirements.

## 4. Audit Trail Integrity
- Drag & Drop moves (changing `salesStage`) log separate stage movement events.
- Because `salesStage` and `status` are decoupled, the timeline now explicitly differentiates between "Moved to Negotiate" and "Marked as Lost in Negotiate", providing a semantically correct and distinct audit trail.
