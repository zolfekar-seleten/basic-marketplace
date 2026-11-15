import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { Permissions } from '../authorization/decorators/permissions.decorator';
import { PermissionsGuard } from '../authorization/guards/permissions.guard';
import type { UserAuthorizationContext } from '../authorization/interfaces/user-authorization-context.interface';
import { CurrentAuthorizationContext } from '../auth/decorators/current-authorization-context.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ListOrdersDto } from './dto/list-orders.dto';
import { OrdersService } from './orders.service';

@Controller('supplier/orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SupplierOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @Permissions('orders.view_supplier')
  findAll(
    @Query() query: ListOrdersDto,
    @CurrentAuthorizationContext() supplier: UserAuthorizationContext,
  ) {
    return this.ordersService.findSupplierOrders(query, supplier);
  }

  @Get(':id')
  @Permissions('orders.view_supplier')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuthorizationContext() supplier: UserAuthorizationContext,
  ) {
    return this.ordersService.findSupplierOrder(id, supplier);
  }
}
