import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

import { PermissionsService } from '../../authorization/permissions.service';
import { UserAuthorizationContext } from '../../authorization/interfaces/user-authorization-context.interface';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  authorizationContext?: UserAuthorizationContext;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly permissionsService: PermissionsService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authenticated = await super.canActivate(context);

    if (!authenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const userId = request.user?.id;

    if (typeof userId !== 'number' || !Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException();
    }

    const authorizationContext =
      await this.permissionsService.getAuthorizationContextForUser(userId);

    if (!authorizationContext) {
      throw new UnauthorizedException();
    }

    request.authorizationContext = authorizationContext;
    response.setHeader(
      'X-Permissions-Version',
      String(authorizationContext.permissionsVersion),
    );

    return true;
  }
}
