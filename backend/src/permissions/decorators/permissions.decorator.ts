import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (permission: { category: string, action: string }) => SetMetadata(PERMISSIONS_KEY, permission);
