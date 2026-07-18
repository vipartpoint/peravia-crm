# UI Migration Plan

## 1. Kanban Board Structure
- **Columns**: Strictly 7 columns rendered from a constant array: `['Suspect', 'Prospect', 'Analysis', 'Negotiate', 'Close', 'Order', 'Payment']`.
- **Eliminated Columns**: Remove 'Won' and 'Lost' pseudo-columns from the board grid.

## 2. Card UI
- **Status Badges**: Each Opportunity card displays a persistent badge reflecting its `status` (Open, Won, Lost).
- **Lost UI State**: A Lost card retains its position in its current `salesStage` column. Visually, it might be dimmed or explicitly marked with a red 'Lost' badge and reason.

## 3. Filters & Views
- **Board Filters**: Add a status toggle/dropdown above the Kanban board: `All | Open | Won | Lost`.
- **Default View**: Default the filter to `Open`. Lost/Won cards are hidden from the active board by default to prevent clutter, but remain in their canonical column when the filter includes them.

## 4. Drag & Drop Interactions
- Dragging only updates `salesStage`.
- Moving a `Lost` card is disabled (unless reopened).
- Dropping into `Payment` must trigger (or require) final validation. If successful and payment is confirmed, a prompt or automatic hook changes `status` to `Won`.

## 5. Reopen / Mark Lost Modals
- **Mark as Lost**: Clicking a "Mark Lost" action on an Open card triggers a modal requesting `lostReason` and `competitorName`. It updates `status` but does not trigger a column move.
- **Reopen**: Clicking "Reopen" on a Lost card triggers a modal for reopening reason and sets status back to `Open`.
