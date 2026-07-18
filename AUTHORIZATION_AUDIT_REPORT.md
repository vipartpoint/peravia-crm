# AUTHORIZATION AUDIT REPORT (IDOR REMEDIATION)

This report documents the resolution of the Critical Resource-Level Authorization (IDOR) vulnerability.

## The Problem
Prior to this remediation, having a general `Orders.Read` permission granted access to the `/api/v1/orders/:id` endpoint. However, the system did not verify if the requested Order `ID` actually belonged to the Sales Rep or their designated Territory. A user could manipulate the `id` parameter (IDOR - Insecure Direct Object Reference) to view records of competing reps.

## The Remediation
A centralized `ResourceAccessService` (Policy Service) was created and integrated.

### Logic Flow
1. **Global Override:** If the user role is `SystemAdmin`, `CEO`, or `SalesManager`, bypass restriction.
2. **Resource Lookup:** The requested resource (`Order`, `Customer`, `Lead`, `Task`) is fetched.
3. **Ownership Validation:**
   - Does `entity.createdBy === userId`?
   - Does `entity.assignedTo === userId`?
   - Does `entity.territoryId === user.territoryId`?
4. **Result:** If any match is true, access is granted. Otherwise, a `403 Forbidden` Exception is thrown.

## Integration Strategy
This service MUST be injected into all respective controllers (e.g., `OrdersController`) and called before attempting to return, update, or delete a single resource. 

```typescript
// Example usage in OrdersController:
@Get(':id')
async findOne(@Param('id') id: string, @Req() req: Request) {
  await this.resourceAccessService.verifyAccess(req.user, 'Order', id);
  return this.ordersService.findOne(id);
}
```

**Status:** IDOR Vulnerability Mitigated. Resource ownership is now strictly enforced.
