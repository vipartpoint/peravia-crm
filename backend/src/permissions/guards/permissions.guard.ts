import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsService } from '../permissions.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private permissionsService: PermissionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<{ category: string, action: string }>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (!requiredPermission) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException('User not authenticated');
    
    const hasPermission = await this.permissionsService.checkPermission(user.id, requiredPermission.category, requiredPermission.action);
    if (!hasPermission) {
      throw new ForbiddenException(`Missing permission: ${requiredPermission.category}.${requiredPermission.action}`);
    }
    return true;
  }
}
