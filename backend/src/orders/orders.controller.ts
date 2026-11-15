import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Permissions } from '../authorization/decorators/permissions.decorator';
import { PermissionsGuard } from '../authorization/guards/permissions.guard';
import type { UserAuthorizationContext } from '../authorization/interfaces/user-authorization-context.interface';
import { CurrentAuthorizationContext } from '../auth/decorators/current-authorization-context.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { ListOrdersDto } from './dto/list-orders.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @Permissions('orders.create')
  checkout(@CurrentAuthorizationContext() buyer: UserAuthorizationContext) {
    return this.ordersService.checkout(buyer);
  }

  @Get()
  @Permissions('orders.view_own')
  findAll(
    @Query() query: ListOrdersDto,
    @CurrentAuthorizationContext() buyer: UserAuthorizationContext,
  ) {
    return this.ordersService.findBuyerOrders(query, buyer);
  }

  @Get(':id')
  @Permissions('orders.view_own')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuthorizationContext() buyer: UserAuthorizationContext,
  ) {
    return this.ordersService.findBuyerOrder(id, buyer);
  }
}
