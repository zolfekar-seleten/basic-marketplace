import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { Product } from './entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductImageStorage } from './product-image.storage';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, User]),
    AuthModule,
    AuthorizationModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductImageStorage],
  exports: [TypeOrmModule, ProductsService],
})
export class ProductsModule {}
