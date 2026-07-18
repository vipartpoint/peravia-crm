# CODE AUDIT REPORT

This report focuses on the codebase architecture, module boundaries, code quality, and technical debt.

## 1. Controller/Service God Objects
- **Severity:** High
- **Affected Modules:** `customers.service.ts`, `orders.service.ts`
- **Why it matters:** As business logic grows, placing all logic inside a single service class creates a "God Object" which is hard to test, maintain, and violates the Single Responsibility Principle.
- **Risk Impact:** High coupling, merge conflicts, difficulty in writing unit tests.
- **Recommended Fix:** Refactor using the CQRS pattern or split into smaller domain services (e.g., `OrderCreationService`, `OrderApprovalService`).

## 2. Lack of Centralized Data Masking
- **Severity:** High
- **Affected Modules:** Financial Modules (Receivables, Payments)
- **Why it matters:** Masking data (e.g., replacing amounts with `***`) is currently handled manually in service mappers. This relies heavily on developer memory.
- **Risk Impact:** If a developer forgets to apply the mapper on a new endpoint, sensitive financial data leaks to unauthorized users.
- **Recommended Fix:** Use NestJS Interceptors or `class-transformer` decorators (e.g., `@Transform` based on request context role) to enforce masking globally at the presentation layer.

## 3. Duplicate Query Logic
- **Severity:** Medium
- **Affected Modules:** All CRM modules where `userId` or `territoryId` filtering is applied.
- **Why it matters:** Ensuring a `SalesRep` only sees their own data requires manually appending `where: { assignedTo: userId }` in every `findMany` call.
- **Risk Impact:** Accidental data exposure if the `where` clause is forgotten in a single endpoint.
- **Recommended Fix:** Implement a Prisma Client Extension or Middleware that automatically injects tenant/user isolation rules into queries based on the AsyncLocalStorage context.

## 4. Hardcoded Permission Strings
- **Severity:** Medium
- **Affected Modules:** AuthGuard, Permissions Decorator
- **Why it matters:** Permissions are passed as strings (e.g., `@RequirePermissions('Orders.Read')`). 
- **Risk Impact:** Typos in strings will silently fail or grant incorrect access. Refactoring becomes dangerous.
- **Recommended Fix:** Generate an Enum or constant dictionary of all available permissions and strictly type the decorator.

## 5. Over-fetching in Prisma
- **Severity:** Low
- **Affected Modules:** `users.service.ts`
- **Why it matters:** Default Prisma queries pull all columns unless `select` is specified.
- **Risk Impact:** Accidentally sending `passwordHash` or `mfaSecret` to the client if DTO serialization fails.
- **Recommended Fix:** Enforce rigorous use of Prisma `select` for all `GET` endpoints.
