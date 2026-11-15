import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { Permissions } from '../authorization/decorators/permissions.decorator';
import type { UserAuthorizationContext } from '../authorization/interfaces/user-authorization-context.interface';
import { CurrentAuthorizationContext } from '../auth/decorators/current-authorization-context.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../authorization/guards/permissions.guard';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('cart.manage')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('items')
  addItem(
    @Body() dto: AddCartItemDto,
    @CurrentAuthorizationContext() buyer: UserAuthorizationContext,
  ) {
    return this.cartService.addItem(dto, buyer);
  }

  @Get()
  getCart(@CurrentAuthorizationContext() buyer: UserAuthorizationContext) {
    return this.cartService.getCart(buyer);
  }

  @Patch('items/:id')
  updateItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
    @CurrentAuthorizationContext() buyer: UserAuthorizationContext,
  ) {
    return this.cartService.updateItem(id, dto, buyer);
  }

  @Delete('items/:id')
  removeItem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuthorizationContext() buyer: UserAuthorizationContext,
  ) {
    return this.cartService.removeItem(id, buyer);
  }

  @Delete()
  clearCart(@CurrentAuthorizationContext() buyer: UserAuthorizationContext) {
    return this.cartService.clearCart(buyer);
  }
}
