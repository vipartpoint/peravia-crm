# Goal Description

Implement **Stage 3.5 — CRM Delight Layer**. The goal is to upgrade the CRM interface to feel like a premium, modern SaaS product through enhanced UX, subtle animations, better microcopy, and quality-of-life features (Favorites, Recents, Shortcuts, Hover Cards) without modifying the backend or business logic.

> [!IMPORTANT]  
> This phase is strictly limited to Frontend and UX changes. All feature states (like tours, favorites, recents) will use `localStorage`.

## Proposed Changes

### 1. Global Contexts & Providers

#### [NEW] `frontend/src/hooks/useFavorites.ts`
- Hook to manage favorites using `localStorage` (`crm_favorites`).

#### [NEW] `frontend/src/hooks/useRecentWork.ts`
- Hook to track recently visited entities (customers, leads, orders, reports, AI assistant) using `localStorage` (`crm_recent_work`).

#### [NEW] `frontend/src/components/ui/CelebrationSystem.tsx`
- A global component managing subtle, premium achievements and celebration animations (e.g. a glowing aura and an elegant toast) triggered via a custom event when important actions occur (e.g., Lead converted, First order).

#### [MODIFY] `frontend/src/app/(dashboard)/layout.tsx`
- Mount `<CelebrationSystem />`, `<ShortcutModal />`, and `<ProductTour />`.
- Add a global keyboard event listener for shortcut sequences (`N` then `L`, `N` then `C`, `N` then `O`) and `?` to open the Shortcut Center.

---

### 2. Micro-Interactions & UI Upgrades

#### [NEW] `frontend/src/components/ui/ProductTour.tsx`
- First-login tour highlighting: Dashboard, Command Palette, Quick Actions, Notifications, AI Assistant, Customer Timeline. Uses `localStorage` to run only once.

#### [NEW] `frontend/src/components/ui/SmartTip.tsx`
- A dismissible contextual tip component stored in `localStorage` based on the page context.

#### [NEW] `frontend/src/components/ui/ShortcutModal.tsx`
- Modal triggered by `?` detailing available keyboard shortcuts.

#### [NEW] `frontend/src/components/ui/HoverCard.tsx`
- A lightweight hover preview card to display minimal details without navigating away.

#### [MODIFY] `frontend/src/components/ui/CommandPalette.tsx`
- **Command Palette Pro**: Add "Favorites" and "Recent Work" sections. 
- Integrate `useFavorites` and `useRecentWork`.
- Add "Quick Create" actions.

#### [MODIFY] `frontend/src/components/ui/EmptyState.tsx`
- Upgrade to a **Premium Empty State** design.
- Refine typography, padding, and subtle illustrations/icons.
- Ensure all instances across the app provide a primary CTA and optional secondary CTA.

---

### 3. Data Presentation & Microcopy

#### [NEW] `frontend/src/utils/time.ts`
- Create `getRelativeTime(date)` function.
- Converts timestamps to "همین الان", "۵ دقیقه پیش", "امروز", "دیروز", "۳ روز پیش".

#### [MODIFY] `frontend/src/components/ui/Timeline.tsx`
- **Activity Language Rewrite**: Map technical backend activity strings (`LEAD_CONVERTED`, `ORDER_APPROVED`) to human-readable conversational Persian.
- Integrate `getRelativeTime` for timestamps.

#### [MODIFY] `frontend/src/components/forms/*` (e.g., `LeadForm.tsx`, `OrderForm.tsx`, etc.)
- **Better Success Messages**: Update `Toast` calls from generic "ثبت شد" to descriptive, premium text (e.g., "سفارش ثبت شد و برای ادامه فرآیند فروش آماده است.").
- Trigger the **Celebration System** for key milestone creation events.

---

### 4. Design Aesthetics & Visual Noise Reduction

#### [MODIFY] `frontend/tailwind.config.js` or `frontend/src/app/globals.css` (if applicable)
- Define standard motion variables if needed.

#### [MODIFY] Global Components (`Card.tsx`, `Button.tsx`, `DataTable.tsx`, `SlideOver.tsx`)
- **Motion Pass**: Normalize all Framer Motion parameters to `duration: 0.15` to `0.2`, `easeOut`. Eliminate excessive bouncy animations.
- **Visual Noise Reduction**: Lighten border colors, remove redundant icons inside dense tables, and establish a cleaner hierarchy.

## Open Questions

> [!WARNING]  
> 1. **Product Tour Implementation**: Do you want a custom, lightweight CSS-based spotlight component for the tour, or should I use a lightweight third-party library like `react-joyride`? (I recommend a custom lightweight spotlight to maintain full design control).
> 2. **Favorites Persistence**: Since favorites are stored in `localStorage` for the MVP, they will not sync across devices. Is this acceptable for Stage 3.5?

## Verification Plan

### Automated Tests
- Run `npm run build` on the frontend to ensure no build or typing errors.

### Manual Verification
1. Open the app in incognito to trigger the **Product Tour** and **Smart Tips**.
2. Press `?` to test the **Keyboard Shortcuts Center**.
3. Type `N` then `C` to test sequence shortcuts for entity creation.
4. Add items to **Favorites** and check if they appear in the Command Palette (`Cmd+K`).
5. Create a new Order to trigger the new descriptive **Success Message** and **Celebration System**.
6. View the Timeline on a Customer Detail page to verify **Activity Language** and **Relative Time**.
