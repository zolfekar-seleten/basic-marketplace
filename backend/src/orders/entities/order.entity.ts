import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
  Index,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
@Check('CHK_orders_total_amount_non_negative', '"total_amount" >= 0')
@Check('CHK_orders_status_allowed', `"status" IN ('pending', 'completed')`)
@Index(['buyerId'])
@Index(['supplierId'])
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'buyer_id', type: 'int' })
  buyerId: number;

  @ManyToOne(() => User, (user) => user.buyerOrders, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @Column({ name: 'supplier_id', type: 'int' })
  supplierId: number;

  @ManyToOne(() => User, (user) => user.supplierOrders, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'supplier_id' })
  supplier: User;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: 'pending' | 'completed';

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 2 })
  totalAmount: string;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  items: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
