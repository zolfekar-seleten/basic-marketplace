import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { RolePermission } from '../roles/entities/role-permission.entity';
import { Permission } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionsRepository: Repository<RolePermission>,
  ) {}

  findAll(): Promise<Permission[]> {
    return this.permissionsRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionsRepository.findOneBy({ id });

    if (!permission) {
      throw new NotFoundException(`Permission ${id} was not found`);
    }

    return permission;
  }

  async create(dto: CreatePermissionDto): Promise<Permission> {
    const permission = this.permissionsRepository.create({
      name: dto.name,
      description: dto.description ?? null,
    });

    try {
      return await this.permissionsRepository.save(permission);
    } catch (error) {
      if (this.getPostgresErrorCode(error) === '23505') {
        throw new ConflictException('A permission with this name already exists');
      }

      throw error;
    }
  }

  async update(id: number, dto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);
    permission.description = dto.description;

    return this.permissionsRepository.save(permission);
  }

  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);
    const assignmentCount = await this.rolePermissionsRepository.countBy({
      permissionId: id,
    });

    if (assignmentCount > 0) {
      throw new ConflictException(
        'This permission is assigned to one or more roles and cannot be deleted',
      );
    }

    try {
      await this.permissionsRepository.remove(permission);
    } catch (error) {
      if (this.getPostgresErrorCode(error) === '23503') {
        throw new ConflictException(
          'This permission is assigned to one or more roles and cannot be deleted',
        );
      }

      throw error;
    }
  }

  private getPostgresErrorCode(error: unknown): string | undefined {
    if (!(error instanceof QueryFailedError)) {
      return undefined;
    }

    return (error as QueryFailedError & { driverError?: { code?: string } })
      .driverError?.code;
  }
}
