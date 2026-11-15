import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { UserAuthorizationContext } from '../../authorization/interfaces/user-authorization-context.interface';

interface AuthenticatedRequest extends Request {
  authorizationContext?: UserAuthorizationContext;
}

export const CurrentAuthorizationContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserAuthorizationContext => {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();
    const authorizationContext = request.authorizationContext;

    if (!authorizationContext) {
      throw new UnauthorizedException();
    }

    return authorizationContext;
  },
);
