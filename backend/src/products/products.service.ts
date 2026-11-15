import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';

import { UserAuthorizationContext } from '../authorization/interfaces/user-authorization-context.interface';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsDto } from './dto/list-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import {
  ProductImageStorage,
  UploadedProductImage,
} from './product-image.storage';

export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  imageUrl: string | null;
  isActive: boolean;
  category: { id: number; name: string };
  supplier: { id: number; name: string };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly productImageStorage: ProductImageStorage,
  ) {}

  async create(
    dto: CreateProductDto,
    actor: UserAuthorizationContext,
    image?: UploadedProductImage,
  ): Promise<ProductResponse> {
    this.assertCanManageProducts(actor);
    this.assertValidStock(dto.stock);
    const category = await this.findCategory(dto.categoryId);
    const supplierId = await this.getSupplierIdForCreate(dto, actor);

    const imageUrl = image
      ? await this.productImageStorage.save(image)
      : dto.imageUrl?.trim() || null;
    try {
      const product = this.productsRepository.create({
        name: this.normalizeName(dto.name),
        description: dto.description?.trim() || null,
        price: this.formatPrice(dto.price),
        stock: dto.stock,
        imageUrl,
        isActive: dto.isActive ?? true,
        categoryId: category.id,
        category,
        supplierId,
      });
      const created = await this.productsRepository.save(product);
      const loaded = await this.loadProduct(
        this.productsRepository,
        created.id,
      );

      if (!loaded) {
        throw new NotFoundException(`Product ${created.id} was not found`);
      }

      return this.toResponse(loaded);
    } catch (error) {
      await this.productImageStorage.removeAfterFailure(
        image ? imageUrl : undefined,
      );
      throw error;
    }
  }

  async findAll(query: ListProductsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const builder = this.productsRepository
      .createQueryBuilder('product')
      .select([
        'product.id',
        'product.name',
        'product.description',
        'product.price',
        'product.stock',
        'product.imageUrl',
        'product.isActive',
        'product.categoryId',
        'product.supplierId',
        'product.createdAt',
        'product.updatedAt',
      ])
      .innerJoin('product.category', 'category')
      .addSelect(['category.id', 'category.name'])
      .innerJoin('product.supplier', 'supplier')
      .addSelect(['supplier.id', 'supplier.name']);

    builder.andWhere('product.isActive = true');

    if (query.search) {
      builder.andWhere('product.name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query.categoryId !== undefined) {
      builder.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.supplierId !== undefined) {
      builder.andWhere('product.supplierId = :filterSupplierId', {
        filterSupplierId: query.supplierId,
      });
    }

    if (query.minPrice !== undefined) {
      builder.andWhere('product.price >= :minPrice', {
        minPrice: query.minPrice,
      });
    }

    if (query.maxPrice !== undefined) {
      builder.andWhere('product.price <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    if (query.minPrice !== undefined && query.maxPrice !== undefined) {
      if (query.minPrice > query.maxPrice) {
        throw new BadRequestException(
          'minPrice must be less than or equal to maxPrice',
        );
      }
    }

    const sortColumns = {
      price: 'product.price',
      name: 'product.name',
      createdAt: 'product.createdAt',
    } as const;
    const [products, total] = await builder
      .orderBy(
        sortColumns[query.sortBy ?? 'createdAt'],
        query.sortOrder ?? 'DESC',
      )
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: products.map((product) => this.toResponse(product)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<ProductResponse> {
    const builder = this.createProductQuery(this.productsRepository).where(
      'product.id = :id',
      { id },
    );

    builder.andWhere('product.isActive = true');

    const product = await builder.getOne();

    if (!product) {
      throw new NotFoundException(`Product ${id} was not found`);
    }

    return this.toResponse(product);
  }

  async update(
    id: number,
    dto: UpdateProductDto,
    actor: UserAuthorizationContext,
    image?: UploadedProductImage,
  ): Promise<ProductResponse> {
    this.assertCanManageProducts(actor);
    let newImageUrl: string | undefined;
    let previousImageUrl: string | null = null;
    try {
      const updated = await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(Product);
        const product = await repository
          .createQueryBuilder('product')
          .setLock('pessimistic_write')
          .where('product.id = :id', { id })
          .getOne();

        if (!product) {
          throw new NotFoundException(`Product ${id} was not found`);
        }

        this.assertProductOwnership(product, actor);
        previousImageUrl = product.imageUrl;

        if (dto.name !== undefined) {
          product.name = this.normalizeName(dto.name);
        }
        if (dto.description !== undefined) {
          product.description = dto.description?.trim() || null;
        }
        if (dto.price !== undefined) {
          product.price = this.formatPrice(dto.price);
        }
        if (dto.stock !== undefined) {
          this.assertValidStock(dto.stock);
          product.stock = dto.stock;
        }
        if (dto.categoryId !== undefined) {
          const category = await this.findCategory(dto.categoryId, manager);
          product.categoryId = category.id;
          product.category = category;
        }
        if (image) {
          newImageUrl = await this.productImageStorage.save(image);
          product.imageUrl = newImageUrl;
        }
        if (dto.isActive !== undefined) {
          product.isActive = dto.isActive;
        }

        await repository.save(product);
        const updated = await this.loadProduct(repository, id);

        if (!updated) {
          throw new NotFoundException(`Product ${id} was not found`);
        }

        return this.toResponse(updated);
      });
      if (newImageUrl)
        await this.productImageStorage.removeManaged(previousImageUrl);
      return updated;
    } catch (error) {
      await this.productImageStorage.removeAfterFailure(newImageUrl);
      throw error;
    }
  }

  async remove(id: number, actor: UserAuthorizationContext): Promise<void> {
    this.assertCanManageProducts(actor);
    let imageUrl: string | null = null;

    try {
      await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(Product);
        const product = await repository
          .createQueryBuilder('product')
          .setLock('pessimistic_write')
          .where('product.id = :id', { id })
          .getOne();

        if (!product) {
          throw new NotFoundException(`Product ${id} was not found`);
        }

        this.assertProductOwnership(product, actor);
        imageUrl = product.imageUrl;
        await repository.remove(product);
      });
    } catch (error) {
      if (this.getPostgresErrorCode(error) === '23503') {
        throw new ConflictException(
          'This product is referenced by a cart or order and cannot be deleted; deactivate it instead',
        );
      }

      throw error;
    }
    await this.productImageStorage.removeManaged(imageUrl);
  }

  private async getSupplierIdForCreate(
    dto: CreateProductDto,
    actor: UserAuthorizationContext,
  ): Promise<number> {
    if (actor.role.name === 'supplier') {
      if (dto.supplierId !== undefined) {
        throw new BadRequestException(
          'Suppliers cannot choose a supplierId when creating products',
        );
      }

      return actor.id;
    }

    if (actor.role.name !== 'admin') {
      throw new ForbiddenException();
    }

    if (dto.supplierId === undefined) {
      throw new BadRequestException(
        'supplierId is required when an administrator creates a product',
      );
    }

    await this.findActiveSupplier(dto.supplierId);
    return dto.supplierId;
  }

  private async findActiveSupplier(id: number): Promise<User> {
    const supplier = await this.usersRepository
      .createQueryBuilder('user')
      .innerJoin('user.role', 'role')
      .where('user.id = :id', { id })
      .andWhere('role.name = :roleName', { roleName: 'supplier' })
      .andWhere('user.isActive = true')
      .getOne();

    if (!supplier) {
      throw new BadRequestException(`Active supplier ${id} was not found`);
    }

    return supplier;
  }

  private async findCategory(
    id: number,
    manager?: EntityManager,
  ): Promise<Category> {
    const category = await (manager ?? this.dataSource.manager)
      .getRepository(Category)
      .findOneBy({ id });

    if (!category) {
      throw new BadRequestException(`Category ${id} was not found`);
    }

    return category;
  }

  private createProductQuery(repository: Repository<Product>) {
    return repository
      .createQueryBuilder('product')
      .innerJoin('product.category', 'category')
      .addSelect(['category.id', 'category.name'])
      .innerJoin('product.supplier', 'supplier')
      .addSelect(['supplier.id', 'supplier.name']);
  }

  private async loadProduct(
    repository: Repository<Product>,
    id: number,
  ): Promise<Product | null> {
    return this.createProductQuery(repository)
      .where('product.id = :id', { id })
      .getOne();
  }

  private assertCanManageProducts(actor: UserAuthorizationContext): void {
    if (actor.role.name !== 'supplier' && actor.role.name !== 'admin') {
      throw new ForbiddenException();
    }
  }

  private assertProductOwnership(
    product: Product,
    actor: UserAuthorizationContext,
  ): void {
    if (actor.role.name === 'supplier' && product.supplierId !== actor.id) {
      throw new ForbiddenException();
    }

    if (actor.role.name !== 'supplier' && actor.role.name !== 'admin') {
      throw new ForbiddenException();
    }
  }

  private assertValidStock(stock: number): void {
    if (!Number.isInteger(stock) || stock < 0) {
      throw new BadRequestException('Stock must be a non-negative integer');
    }
  }

  private formatPrice(price: number): string {
    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      !/^\d+(\.\d{1,2})?$/.test(String(price))
    ) {
      throw new BadRequestException(
        'Price must be a positive amount with at most two decimal places',
      );
    }

    return price.toFixed(2);
  }

  private normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  private toResponse(product: Product): ProductResponse {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      category: {
        id: product.category.id,
        name: product.category.name,
      },
      supplier: {
        id: product.supplier.id,
        name: product.supplier.name,
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private getPostgresErrorCode(error: unknown): string | undefined {
    if (!(error instanceof QueryFailedError)) {
      return undefined;
    }

    return (error as QueryFailedError & { driverError?: { code?: string } })
      .driverError?.code;
  }
}
