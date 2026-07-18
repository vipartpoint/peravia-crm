# Sales Pipeline UI Polish Report

## Sidebar Active State Fix
### Issue
Previously, the `Sidebar.tsx` navigation component used a simple `pathname.startsWith(item.href)` check to apply the highlighted active state. Because `/opportunities/dashboard` starts with `/opportunities`, both menu items incorrectly appeared as active simultaneously.

### Resolution
The active state logic was refactored to use **route priority matching**.
```typescript
const allItems = menuGroups.flatMap(g => g.items);
const matchingItems = allItems.filter(i => pathname === i.href || pathname.startsWith(i.href + '/'));
const bestMatch = matchingItems.sort((a, b) => b.href.length - a.href.length)[0];

const active = bestMatch ? bestMatch.href === item.href : (pathname === item.href || pathname.startsWith(item.href + '/'));
```

### Verification
- Navigating to `/opportunities` → Only `فرصتهای فروش` is active.
- Navigating to `/opportunities/dashboard` → Only `گزارش قیف فروش` is active.
- Detail routes like `/opportunities/123` correctly keep `/opportunities` active because it is the longest matching defined route path.
