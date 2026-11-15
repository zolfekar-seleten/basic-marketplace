import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Brackets, QueryFailedError, Repository } from 'typeorm';

import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListSuppliersDto } from './dto/list-suppliers.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

export interface SupplierResponse {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async create(dto: CreateSupplierDto): Promise<SupplierResponse> {
    const supplierRole = await this.rolesRepository.findOneBy({
      name: 'supplier',
    });

    if (!supplierRole) {
      throw new InternalServerErrorException(
        'Supplier role is not configured',
      );
    }

    const email = this.normalizeEmail(dto.email);
    await this.ensureEmailAvailable(email);

    const supplier = this.usersRepository.create({
      name: this.normalizeName(dto.name),
      email,
      password: await bcrypt.hash(dto.password, 12),
      roleId: supplierRole.id,
      role: supplierRole,
      isActive: true,
    });

    try {
      const created = await this.usersRepository.save(supplier);
      return this.toResponse(created);
    } catch (error) {
      if (this.getPostgresErrorCode(error) === '23505') {
        throw new ConflictException('A user with this email already exists');
      }

      throw error;
    }
  }

  async findAll(query: ListSuppliersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const builder = this.usersRepository
      .createQueryBuilder('supplier')
      .innerJoin('supplier.role', 'role')
      .where('role.name = :roleName', { roleName: 'supplier' })
      .select([
        'supplier.id',
        'supplier.name',
        'supplier.email',
        'supplier.isActive',
        'supplier.createdAt',
        'supplier.updatedAt',
      ]);

    if (query.search) {
      const search = `%${query.search}%`;
      builder.andWhere(
        new Brackets((where) =>
          where
            .where('supplier.name ILIKE :search', { search })
            .orWhere('supplier.email ILIKE :search', { search }),
        ),
      );
    }

    if (query.isActive !== undefined) {
      builder.andWhere('supplier.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    const [suppliers, total] = await builder
      .orderBy('supplier.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: suppliers.map((supplier) => this.toResponse(supplier)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<SupplierResponse> {
    const supplier = await this.findSupplier(id);
    return this.toResponse(supplier);
  }

  async update(
    id: number,
    dto: UpdateSupplierDto,
  ): Promise<SupplierResponse> {
    const supplier = await this.findSupplier(id);

    if (dto.name !== undefined) {
      supplier.name = this.normalizeName(dto.name);
    }

    if (dto.email !== undefined) {
      const email = this.normalizeEmail(dto.email);
      await this.ensureEmailAvailable(email, id);
      supplier.email = email;
    }

    try {
      const updated = await this.usersRepository.save(supplier);
      return this.toResponse(updated);
    } catch (error) {
      if (this.getPostgresErrorCode(error) === '23505') {
        throw new ConflictException('A user with this email already exists');
      }

      throw error;
    }
  }

  async setActive(id: number, isActive: boolean): Promise<SupplierResponse> {
    const supplier = await this.findSupplier(id);
    supplier.isActive = isActive;

    const updated = await this.usersRepository.save(supplier);
    return this.toResponse(updated);
  }

  private async findSupplier(id: number): Promise<User> {
    const supplier = await this.usersRepository
      .createQueryBuilder('supplier')
      .innerJoin('supplier.role', 'role')
      .where('supplier.id = :id', { id })
      .andWhere('role.name = :roleName', { roleName: 'supplier' })
      .getOne();

    if (!supplier) {
      throw new NotFoundException(`Supplier ${id} was not found`);
    }

    return supplier;
  }

  private async ensureEmailAvailable(
    email: string,
    exceptUserId?: number,
  ): Promise<void> {
    const query = this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(BTRIM(user.email)) = :email', { email });

    if (exceptUserId !== undefined) {
      query.andWhere('user.id != :exceptUserId', { exceptUserId });
    }

    if (await query.getOne()) {
      throw new ConflictException('A user with this email already exists');
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, ' ');
  }

  private toResponse(user: User): SupplierResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
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
