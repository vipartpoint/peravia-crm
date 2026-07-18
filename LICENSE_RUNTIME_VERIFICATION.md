# License Runtime Verification

## Guard Registration Architecture
The `LicenseGuard` is registered globally within the root `app.module.ts`:
```typescript
{
  provide: APP_GUARD,
  useClass: LicenseGuard,
}
```

## Security Guarantees
- Because it utilizes NestJS's `APP_GUARD` token, it is injected at the deepest level of the framework's execution context.
- It executes *before* any controller logic, interceptors, or route handlers.
- **Bypass impossibility**: There is no mechanism for an API route to bypass this guard organically unless it is explicitly decorated with a `@Public()` or bypass metadata tag. Currently, only the diagnostic endpoint `/api/v1/system/license-status` is permitted to bypass the guard to allow infrastructure health checks (like Docker `HEALTHCHECK`) to pass even if the license itself has expired or is invalid.

This guarantees that if the license is manipulated, missing, or invalid, all business logic routes are definitively locked out, returning `402 Payment Required`.
