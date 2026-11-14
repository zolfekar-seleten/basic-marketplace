import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(RolePermission)
    private readonly rolePermissionsRepository: Repository<RolePermission>,
  ) {}

  async getPermissionsForUser(userId: number): Promise<string[]> {
    try {
      const assignments = await this.rolePermissionsRepository
        .createQueryBuilder('rolePermission')
        .innerJoin('rolePermission.role', 'role')
        .innerJoin('role.users', 'user')
        .innerJoin('rolePermission.permission', 'permission')
        .where('user.id = :userId', { userId })
        .select('permission.name', 'name')
        .getRawMany<{ name: string }>();

      return assignments.map(({ name }) => name);
    } catch {
      throw new InternalServerErrorException(
        'Unable to verify user permissions',
      );
    }
  }
}
