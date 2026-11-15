import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { UserAuthorizationContext } from './interfaces/user-authorization-context.interface';

interface AuthorizationRow {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  permissionsVersion: number;
  permissionName: string | null;
}

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getAuthorizationContextForUser(
    userId: number,
  ): Promise<UserAuthorizationContext | null> {
    try {
      const rows = await this.usersRepository
        .createQueryBuilder('user')
        .innerJoin('user.role', 'role')
        .leftJoin('role.rolePermissions', 'rolePermission')
        .leftJoin('rolePermission.permission', 'permission')
        .where('user.id = :userId', { userId })
        .select('user.id', 'id')
        .addSelect('user.name', 'name')
        .addSelect('user.email', 'email')
        .addSelect('role.id', 'roleId')
        .addSelect('role.name', 'roleName')
        .addSelect('role.permissionsVersion', 'permissionsVersion')
        .addSelect('permission.name', 'permissionName')
        .getRawMany<AuthorizationRow>();

      if (rows.length === 0) {
        return null;
      }

      const user = rows[0];

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: {
          id: user.roleId,
          name: user.roleName,
        },
        permissions: [
          ...new Set(
            rows.flatMap((row) =>
              row.permissionName ? [row.permissionName] : [],
            ),
          ),
        ],
        permissionsVersion: user.permissionsVersion,
      };
    } catch {
      throw new InternalServerErrorException(
        'Unable to retrieve user authorization data',
      );
    }
  }
}
