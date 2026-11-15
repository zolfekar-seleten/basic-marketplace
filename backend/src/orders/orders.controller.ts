import { Controller, Post, UseGuards } from '@nestjs/common';

import { Permissions } from '../authorization/decorators/permissions.decorator';
import { PermissionsGuard } from '../authorization/guards/permissions.guard';
import type { UserAuthorizationContext } from '../authorization/interfaces/user-authorization-context.interface';
import { CurrentAuthorizationContext } from '../auth/decorators/current-authorization-context.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @Permissions('orders.create')
  checkout(@CurrentAuthorizationContext() buyer: UserAuthorizationContext) {
    return this.ordersService.checkout(buyer);
  }
}
