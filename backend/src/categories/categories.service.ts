import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { Product } from '../products/entities/product.entity';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

interface ProductCountRow {
  categoryId: number | string;
  productCount: number | string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  productCount: number;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(): Promise<CategoryResponse[]> {
    const categories = await this.categoriesRepository.find({
      order: { name: 'ASC' },
    });
    const counts = await this.getProductCounts(categories.map(({ id }) => id));

    return categories.map((category) => this.toResponse(category, counts));
  }

  findProductOptions(): Promise<Array<Pick<Category, 'id' | 'name'>>> {
    return this.categoriesRepository.find({
      select: { id: true, name: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<CategoryResponse> {
    const category = await this.categoriesRepository.findOneBy({ id });

    if (!category) {
      throw new NotFoundException(`Category ${id} was not found`);
    }

    const counts = await this.getProductCounts([id]);
    return this.toResponse(category, counts);
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponse> {
    const name = this.normalizeName(dto.name);
    await this.ensureNameAvailable(name);

    const category = this.categoriesRepository.create({
      name,
      description: dto.description?.trim() || null,
    });

    try {
      const created = await this.categoriesRepository.save(category);
      return this.toResponse(created, new Map());
    } catch (error) {
      if (this.getPostgresErrorCode(error) === '23505') {
        throw new ConflictException('A category with this name already exists');
      }

      throw error;
    }
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<CategoryResponse> {
    const category = await this.categoriesRepository.findOneBy({ id });

    if (!category) {
      throw new NotFoundException(`Category ${id} was not found`);
    }

    if (dto.name !== undefined) {
      const name = this.normalizeName(dto.name);
      await this.ensureNameAvailable(name, id);
      category.name = name;
    }

    if (dto.description !== undefined) {
      category.description = dto.description?.trim() || null;
    }

    try {
      const updated = await this.categoriesRepository.save(category);
      const counts = await this.getProductCounts([id]);
      return this.toResponse(updated, counts);
    } catch (error) {
      if (this.getPostgresErrorCode(error) === '23505') {
        throw new ConflictException('A category with this name already exists');
      }

      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const category = await this.categoriesRepository.findOneBy({ id });

    if (!category) {
      throw new NotFoundException(`Category ${id} was not found`);
    }

    const productCount = await this.productsRepository.countBy({
      categoryId: id,
    });

    if (productCount > 0) {
      throw new ConflictException(
        'This category contains products and cannot be deleted',
      );
    }

    try {
      await this.categoriesRepository.remove(category);
    } catch (error) {
      if (this.getPostgresErrorCode(error) === '23503') {
        throw new ConflictException(
          'This category contains products and cannot be deleted',
        );
      }

      throw error;
    }
  }

  private async ensureNameAvailable(
    name: string,
    exceptId?: number,
  ): Promise<void> {
    const query = this.categoriesRepository
      .createQueryBuilder('category')
      .where('LOWER(BTRIM(category.name)) = :name', {
        name: name.toLowerCase(),
      });

    if (exceptId !== undefined) {
      query.andWhere('category.id != :exceptId', { exceptId });
    }

    if (await query.getOne()) {
      throw new ConflictException('A category with this name already exists');
    }
  }

  private async getProductCounts(
    categoryIds: number[],
  ): Promise<Map<number, number>> {
    if (categoryIds.length === 0) {
      return new Map();
    }

    const rows = await this.productsRepository
      .createQueryBuilder('product')
      .select('product.categoryId', 'categoryId')
      .addSelect('COUNT(product.id)', 'productCount')
      .where('product.categoryId IN (:...categoryIds)', { categoryIds })
      .groupBy('product.categoryId')
      .getRawMany<ProductCountRow>();

    return new Map(
      rows.map(({ categoryId, productCount }) => [
        Number(categoryId),
        Number(productCount),
      ]),
    );
  }

  private toResponse(
    category: Category,
    counts: Map<number, number>,
  ): CategoryResponse {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      productCount: counts.get(category.id) ?? 0,
    };
  }

  private normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  private getPostgresErrorCode(error: unknown): string | undefined {
    if (!(error instanceof QueryFailedError)) {
      return undefined;
    }

    return (error as QueryFailedError & { driverError?: { code?: string } })
      .driverError?.code;
  }
}
