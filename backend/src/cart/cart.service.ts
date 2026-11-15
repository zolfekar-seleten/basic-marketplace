import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';

import { UserAuthorizationContext } from '../authorization/interfaces/user-authorization-context.interface';
import { Product } from '../products/entities/product.entity';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

export interface CartItemResponse {
  id: number;
  product: {
    id: number;
    name: string;
    imageUrl: string | null;
    unitPrice: string;
    stock: number;
    isActive: boolean;
    available: boolean;
  };
  quantity: number;
  subtotal: string;
  availability: 'available' | 'inactive' | 'insufficient_stock';
}

@Injectable()
export class CartService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async addItem(dto: AddCartItemDto, buyer: UserAuthorizationContext) {
    this.assertBuyer(buyer);
    return this.dataSource.transaction(async (manager) => {
      const cart = await this.getOrCreateLockedCart(manager, buyer.id);
      const product = await manager.getRepository(Product).findOneBy({
        id: dto.productId,
      });
      this.assertProductAvailable(product);

      const items = manager.getRepository(CartItem);
      const existing = await items.findOneBy({
        cartId: cart.id,
        productId: product.id,
      });
      const quantity = (existing?.quantity ?? 0) + dto.quantity;
      this.assertStock(quantity, product.stock);

      if (existing) {
        existing.quantity = quantity;
        await items.save(existing);
      } else {
        await items.save(
          items.create({
            cartId: cart.id,
            productId: product.id,
            quantity,
          }),
        );
      }

      return this.loadCart(manager, cart.id);
    });
  }

  async getCart(buyer: UserAuthorizationContext) {
    this.assertBuyer(buyer);
    return this.dataSource.transaction(async (manager) => {
      const cart = await this.getOrCreateLockedCart(manager, buyer.id);
      return this.loadCart(manager, cart.id);
    });
  }

  async updateItem(
    id: number,
    dto: UpdateCartItemDto,
    buyer: UserAuthorizationContext,
  ) {
    this.assertBuyer(buyer);
    return this.dataSource.transaction(async (manager) => {
      const cart = await this.getOrCreateLockedCart(manager, buyer.id);
      const item = await manager.getRepository(CartItem).findOneBy({
        id,
        cartId: cart.id,
      });
      if (!item) {
        throw new NotFoundException('Cart item was not found');
      }

      const product = await manager.getRepository(Product).findOneBy({
        id: item.productId,
      });
      this.assertProductAvailable(product);
      this.assertStock(dto.quantity, product.stock);
      item.quantity = dto.quantity;
      await manager.getRepository(CartItem).save(item);
      return this.loadCart(manager, cart.id);
    });
  }

  async removeItem(id: number, buyer: UserAuthorizationContext) {
    this.assertBuyer(buyer);
    return this.dataSource.transaction(async (manager) => {
      const cart = await this.getOrCreateLockedCart(manager, buyer.id);
      const item = await manager.getRepository(CartItem).findOneBy({
        id,
        cartId: cart.id,
      });
      if (!item) {
        throw new NotFoundException('Cart item was not found');
      }

      await manager.getRepository(CartItem).remove(item);
      return this.loadCart(manager, cart.id);
    });
  }

  async clearCart(buyer: UserAuthorizationContext) {
    this.assertBuyer(buyer);
    return this.dataSource.transaction(async (manager) => {
      const cart = await this.getOrCreateLockedCart(manager, buyer.id);
      await manager.getRepository(CartItem).delete({ cartId: cart.id });
      return this.loadCart(manager, cart.id);
    });
  }

  private assertBuyer(buyer: UserAuthorizationContext): void {
    if (buyer.role.name !== 'buyer') {
      throw new ForbiddenException('Only buyers can manage a shopping cart');
    }
  }

  private assertProductAvailable(
    product: Product | null,
  ): asserts product is Product {
    if (!product) {
      throw new NotFoundException('Product was not found');
    }
    if (!product.isActive) {
      throw new ConflictException(
        'This product is inactive and cannot be added to the cart',
      );
    }
  }

  private assertStock(quantity: number, stock: number): void {
    if (quantity > stock) {
      throw new ConflictException(
        `Only ${stock} units are currently available`,
      );
    }
  }

  private async getOrCreateLockedCart(
    manager: EntityManager,
    buyerId: number,
  ): Promise<Cart> {
    const repository = manager.getRepository(Cart);
    try {
      await repository
        .createQueryBuilder()
        .insert()
        .values({ buyerId })
        .orIgnore()
        .execute();
    } catch (error) {
      if (this.getPostgresErrorCode(error) !== '23505') throw error;
    }

    const cart = await repository
      .createQueryBuilder('cart')
      .setLock('pessimistic_write')
      .where('cart.buyerId = :buyerId', { buyerId })
      .getOne();
    if (!cart) {
      throw new BadRequestException('Could not initialize the shopping cart');
    }
    return cart;
  }

  private async loadCart(manager: EntityManager, cartId: number) {
    const cart = await manager
      .getRepository(Cart)
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .where('cart.id = :cartId', { cartId })
      .orderBy('item.id', 'ASC')
      .getOne();

    if (!cart) {
      throw new NotFoundException('Cart was not found');
    }

    const items: CartItemResponse[] = (cart.items ?? []).map((item) => {
      const product = item.product;
      const active = product.isActive;
      const hasStock = product.stock >= item.quantity;
      const availability = !active
        ? 'inactive'
        : hasStock
          ? 'available'
          : 'insufficient_stock';
      return {
        id: item.id,
        product: {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          unitPrice: product.price,
          stock: product.stock,
          isActive: active,
          available: active && hasStock,
        },
        quantity: item.quantity,
        subtotal: this.multiplyPrice(product.price, item.quantity),
        availability,
      };
    });

    return {
      id: cart.id,
      items,
      total: this.sumPrices(items.map((item) => item.subtotal)),
    };
  }

  private multiplyPrice(price: string, quantity: number): string {
    return this.formatCents(this.priceToCents(price) * BigInt(quantity));
  }

  private sumPrices(prices: string[]): string {
    const totalCents = prices.reduce(
      (sum, price) => sum + this.priceToCents(price),
      0n,
    );
    return this.formatCents(totalCents);
  }

  private priceToCents(price: string): bigint {
    const [whole, fraction = ''] = price.split('.');
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2));
  }

  private formatCents(cents: bigint): string {
    return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
  }

  private getPostgresErrorCode(error: unknown): string | undefined {
    if (!(error instanceof QueryFailedError)) return undefined;
    return (error as QueryFailedError & { driverError?: { code?: string } })
      .driverError?.code;
  }
}
