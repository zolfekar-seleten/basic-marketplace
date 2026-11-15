import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import type { UserAuthorizationContext } from '../authorization/interfaces/user-authorization-context.interface';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { ListOrdersDto } from './dto/list-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

interface CheckoutLine {
  product: Product;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}

@Injectable()
export class OrdersService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findBuyerOrders(
    query: ListOrdersDto,
    buyerContext: UserAuthorizationContext,
  ) {
    this.assertBuyerRole(buyerContext);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const direction = query.sort === 'oldest' ? 'ASC' : 'DESC';
    const builder = this.buyerOrdersQuery(buyerContext.id);

    if (query.status) {
      builder.andWhere('order.status = :status', { status: query.status });
    }

    const [orders, total] = await builder
      .orderBy('order.createdAt', direction)
      .addOrderBy('order.id', direction)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: orders.map((order) => this.toBuyerOrderResponse(order)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findBuyerOrder(id: number, buyerContext: UserAuthorizationContext) {
    this.assertBuyerRole(buyerContext);
    const order = await this.buyerOrdersQuery(buyerContext.id)
      .andWhere('order.id = :id', { id })
      .getOne();

    if (!order) {
      throw new NotFoundException('Order was not found');
    }

    return this.toBuyerOrderResponse(order);
  }

  async findSupplierOrders(
    query: ListOrdersDto,
    supplierContext: UserAuthorizationContext,
  ) {
    this.assertSupplierRole(supplierContext);
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const direction = query.sort === 'oldest' ? 'ASC' : 'DESC';
    const builder = this.supplierOrdersQuery(supplierContext.id);

    if (query.status) {
      builder.andWhere('order.status = :status', { status: query.status });
    }

    const [orders, total] = await builder
      .orderBy('order.createdAt', direction)
      .addOrderBy('order.id', direction)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: orders.map((order) => this.toSupplierOrderResponse(order)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSupplierOrder(
    id: number,
    supplierContext: UserAuthorizationContext,
  ) {
    this.assertSupplierRole(supplierContext);
    const order = await this.supplierOrdersQuery(supplierContext.id)
      .andWhere('order.id = :id', { id })
      .getOne();

    if (!order) {
      throw new NotFoundException('Order was not found');
    }

    return this.toSupplierOrderResponse(order);
  }

  async updateOrderStatus(
    id: number,
    dto: UpdateOrderStatusDto,
    userContext: UserAuthorizationContext,
  ) {
    this.assertCanUpdateOrderStatus(userContext);

    if (dto.status !== 'completed') {
      throw new ConflictException(
        'Orders can only transition from pending to completed',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Order);
      const query = repository
        .createQueryBuilder('order')
        .setLock('pessimistic_write')
        .where('order.id = :id', { id });

      if (userContext.role.name === 'supplier') {
        query.andWhere('order.supplierId = :supplierId', {
          supplierId: userContext.id,
        });
      }

      const order = await query.getOne();
      if (!order) {
        throw new NotFoundException('Order was not found');
      }
      if (order.status !== 'pending') {
        throw new ConflictException(
          'Only pending orders can be marked as completed',
        );
      }

      await repository.update({ id: order.id }, { status: 'completed' });
      const updated = await this.orderWithBuyerAndItemsQuery(repository)
        .where('order.id = :id', { id: order.id })
        .getOne();
      if (!updated) {
        throw new NotFoundException('Order was not found');
      }

      return this.toSupplierOrderResponse(updated);
    });
  }

  private buyerOrdersQuery(buyerId: number) {
    return this.dataSource
      .getRepository(Order)
      .createQueryBuilder('order')
      .select([
        'order.id',
        'order.buyerId',
        'order.supplierId',
        'order.status',
        'order.totalAmount',
        'order.createdAt',
        'order.updatedAt',
        'supplier.id',
        'supplier.name',
        'item.id',
        'item.orderId',
        'item.productId',
        'item.productName',
        'item.unitPrice',
        'item.quantity',
        'item.subtotal',
        'item.createdAt',
      ])
      .innerJoinAndSelect('order.supplier', 'supplier')
      .leftJoinAndSelect('order.items', 'item')
      .where('order.buyerId = :buyerId', { buyerId });
  }

  private toBuyerOrderResponse(order: Order) {
    return {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      supplier: {
        id: order.supplier.id,
        name: order.supplier.name,
      },
      items: (order.items ?? []).map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
    };
  }

  private assertBuyerRole(buyerContext: UserAuthorizationContext): void {
    if (buyerContext.role.name !== 'buyer') {
      throw new ForbiddenException(
        'Only buyers can access buyer order history',
      );
    }
  }

  private supplierOrdersQuery(supplierId: number) {
    return this.orderWithBuyerAndItemsQuery(
      this.dataSource.getRepository(Order),
    ).where('order.supplierId = :supplierId', { supplierId });
  }

  private orderWithBuyerAndItemsQuery(repository: Repository<Order>) {
    return repository
      .createQueryBuilder('order')
      .select([
        'order.id',
        'order.buyerId',
        'order.supplierId',
        'order.status',
        'order.totalAmount',
        'order.createdAt',
        'order.updatedAt',
        'buyer.id',
        'buyer.name',
        'buyer.email',
        'item.id',
        'item.orderId',
        'item.productId',
        'item.productName',
        'item.unitPrice',
        'item.quantity',
        'item.subtotal',
        'item.createdAt',
      ])
      .innerJoinAndSelect('order.buyer', 'buyer')
      .leftJoinAndSelect('order.items', 'item');
  }

  private toSupplierOrderResponse(order: Order) {
    return {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      buyer: {
        id: order.buyer.id,
        name: order.buyer.name,
        email: order.buyer.email,
      },
      items: (order.items ?? []).map((item) => ({
        productId: item.productId,
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
      })),
    };
  }

  private assertSupplierRole(supplierContext: UserAuthorizationContext): void {
    if (supplierContext.role.name !== 'supplier') {
      throw new ForbiddenException(
        'Only suppliers can access supplier order information',
      );
    }
  }

  private assertCanUpdateOrderStatus(
    userContext: UserAuthorizationContext,
  ): void {
    if (userContext.role.name === 'supplier') return;

    if (
      userContext.role.name === 'admin' &&
      userContext.permissions.includes('orders.update_status')
    ) {
      return;
    }

    throw new ForbiddenException(
      'Only suppliers and authorized administrators can update order status',
    );
  }

  async checkout(buyerContext: UserAuthorizationContext) {
    if (buyerContext.role.name !== 'buyer') {
      throw new ForbiddenException('Only buyers can checkout');
    }

    return this.dataSource.transaction(async (manager) => {
      const cart = await manager
        .getRepository(Cart)
        .createQueryBuilder('cart')
        .setLock('pessimistic_write')
        .where('cart.buyerId = :buyerId', { buyerId: buyerContext.id })
        .getOne();
      if (!cart) {
        throw new ConflictException('Your cart is empty');
      }

      const cartItems = await manager.getRepository(CartItem).find({
        where: { cartId: cart.id },
        order: { productId: 'ASC' },
      });
      if (cartItems.length === 0) {
        throw new ConflictException('Your cart is empty');
      }

      for (const item of cartItems) {
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
          throw new ConflictException(
            `Cart item ${item.id} has an invalid quantity`,
          );
        }
      }

      const productIds = cartItems.map((item) => item.productId);
      const products = await manager
        .getRepository(Product)
        .createQueryBuilder('product')
        .where('product.id IN (:...productIds)', { productIds })
        .orderBy('product.id', 'ASC')
        .setLock('pessimistic_write')
        .getMany();
      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );
      const lines: CheckoutLine[] = [];

      for (const item of cartItems) {
        const product = productsById.get(item.productId);
        if (!product) {
          throw new ConflictException(
            `Product ${item.productId} in your cart is no longer available`,
          );
        }
        if (!product.isActive) {
          throw new ConflictException(
            `Product "${product.name}" is inactive and cannot be checked out`,
          );
        }
        if (product.stock < item.quantity) {
          throw new ConflictException(
            `Insufficient stock for "${product.name}": ${product.stock} available, ${item.quantity} requested`,
          );
        }

        const subtotal = this.multiplyPrice(product.price, item.quantity);
        lines.push({
          product,
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal,
        });
      }

      const suppliers = await manager.getRepository(User).find({
        where: {
          id: In([...new Set(lines.map(({ product }) => product.supplierId))]),
        },
        select: { id: true, name: true },
      });
      const suppliersById = new Map(
        suppliers.map((supplier) => [supplier.id, supplier]),
      );
      const linesBySupplier = new Map<number, CheckoutLine[]>();
      for (const line of lines) {
        const supplierId = line.product.supplierId;
        const supplierLines = linesBySupplier.get(supplierId) ?? [];
        supplierLines.push(line);
        linesBySupplier.set(supplierId, supplierLines);
      }

      const orderRepository = manager.getRepository(Order);
      const orderItemRepository = manager.getRepository(OrderItem);
      const createdOrders = [];

      for (const [supplierId, supplierLines] of linesBySupplier) {
        const totalAmount = this.sumPrices(
          supplierLines.map((line) => line.subtotal),
        );
        if (this.priceToCents(totalAmount) > 999999999999n) {
          throw new ConflictException(
            'Order total exceeds the supported amount',
          );
        }

        const order = await orderRepository.save(
          orderRepository.create({
            buyerId: buyerContext.id,
            supplierId,
            status: 'pending',
            totalAmount,
          }),
        );
        const orderItems = supplierLines.map(
          ({ product, quantity, unitPrice, subtotal }) =>
            orderItemRepository.create({
              orderId: order.id,
              productId: product.id,
              productName: product.name,
              unitPrice,
              quantity,
              subtotal,
            }),
        );
        await orderItemRepository.save(orderItems);

        const supplier = suppliersById.get(supplierId);
        if (!supplier) {
          throw new NotFoundException(`Supplier ${supplierId} was not found`);
        }
        createdOrders.push({
          id: order.id,
          supplier: { id: supplier.id, name: supplier.name },
          status: order.status,
          totalAmount: order.totalAmount,
          items: supplierLines.map(
            ({ product, quantity, unitPrice, subtotal }) => ({
              productId: product.id,
              productName: product.name,
              unitPrice,
              quantity,
              subtotal,
            }),
          ),
        });
      }

      for (const line of lines) {
        line.product.stock -= line.quantity;
      }
      await manager
        .getRepository(Product)
        .save(lines.map(({ product }) => product));
      await manager.getRepository(CartItem).delete({ cartId: cart.id });

      return {
        message: 'Checkout completed successfully',
        orders: createdOrders,
      };
    });
  }

  private multiplyPrice(price: string, quantity: number): string {
    return this.formatCents(this.priceToCents(price) * BigInt(quantity));
  }

  private sumPrices(prices: string[]): string {
    return this.formatCents(
      prices.reduce((sum, price) => sum + this.priceToCents(price), 0n),
    );
  }

  private priceToCents(price: string): bigint {
    const [whole, fraction = ''] = price.split('.');
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2));
  }

  private formatCents(cents: bigint): string {
    return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
  }
}
