import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PermissionsService } from '../permissions.service';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/permissions.decorator';

interface AuthenticatedRequest {
  user?: {
    id: number;
  };
  authorizationContext?: {
    permissions: string[];
  };
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;

    if (typeof userId !== 'number' || !Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException();
    }

    const authorizationContext =
      request.authorizationContext ??
      (await this.permissionsService.getAuthorizationContextForUser(userId));

    if (!authorizationContext) {
      throw new UnauthorizedException();
    }

    const userPermissions = authorizationContext.permissions;
    const grantedPermissions = new Set(userPermissions);
    const hasAllPermissions = requiredPermissions.every((permission) =>
      grantedPermissions.has(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException();
    }

    return true;
  }
}
