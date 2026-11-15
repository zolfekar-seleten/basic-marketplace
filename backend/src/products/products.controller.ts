import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { Permissions } from '../authorization/decorators/permissions.decorator';
import type { UserAuthorizationContext } from '../authorization/interfaces/user-authorization-context.interface';
import { PermissionsGuard } from '../authorization/guards/permissions.guard';
import { CurrentAuthorizationContext } from '../auth/decorators/current-authorization-context.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import type { UploadedProductImage } from './product-image.storage';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.create')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
      fileFilter: (_request, file, callback) => {
        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
        ) {
          callback(
            new BadRequestException(
              'Only JPEG, PNG, and WebP images are allowed',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  create(
    @Body() dto: CreateProductDto,
    @UploadedFile() image: UploadedProductImage | undefined,
    @CurrentAuthorizationContext() actor: UserAuthorizationContext,
  ) {
    return this.productsService.create(dto, actor, image);
  }

  @Get()
  findAll(@Query() query: ListProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.view')
  findMine(
    @Query() query: ListProductsDto,
    @CurrentAuthorizationContext() actor: UserAuthorizationContext,
  ) {
    return this.productsService.findMine(query, actor);
  }

  @Get('my/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.view')
  findMineOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuthorizationContext() actor: UserAuthorizationContext,
  ) {
    return this.productsService.findMineOne(id, actor);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.update')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
      fileFilter: (_request, file, callback) => {
        if (
          !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)
        ) {
          callback(
            new BadRequestException(
              'Only JPEG, PNG, and WebP images are allowed',
            ),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
    @UploadedFile() image: UploadedProductImage | undefined,
    @CurrentAuthorizationContext() actor: UserAuthorizationContext,
  ) {
    return this.productsService.update(id, dto, actor, image);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('products.delete')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAuthorizationContext() actor: UserAuthorizationContext,
  ) {
    return this.productsService.remove(id, actor);
  }
}
