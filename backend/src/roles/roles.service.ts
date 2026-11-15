import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';

import { Permission } from '../permissions/entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Role } from './entities/role.entity';

const ADMIN_REQUIRED_PERMISSIONS = [
  'permissions.view',
  'permissions.create',
  'permissions.update',
  'permissions.delete',
  'roles.view',
  'roles.assign_permissions',
] as const;

export interface RolePermissionsResponse {
  id: number;
  name: string;
  permissionsVersion: number;
  permissions: Array<{
    id: number;
    name: string;
    description: string | null;
  }>;
}

@Injectable()
export class RolesService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getRolePermissions(roleId: number): Promise<RolePermissionsResponse> {
    return this.loadRolePermissions(this.dataSource.manager, roleId);
  }

  async synchronizePermissions(
    roleId: number,
    requestedPermissionIds: number[],
    assignedBy: number,
  ): Promise<RolePermissionsResponse> {
    if (new Set(requestedPermissionIds).size !== requestedPermissionIds.length) {
      throw new BadRequestException('permissionIds must not contain duplicates');
    }

    return this.dataSource.transaction(async (manager) => {
      const role = await manager
        .createQueryBuilder(Role, 'role')
        .setLock('pessimistic_write')
        .where('role.id = :roleId', { roleId })
        .getOne();

      if (!role) {
        throw new NotFoundException(`Role ${roleId} was not found`);
      }

      const permissionRepository = manager.getRepository(Permission);
      const requestedPermissions =
        requestedPermissionIds.length > 0
          ? await permissionRepository.findBy({
              id: In(requestedPermissionIds),
            })
          : [];

      if (requestedPermissions.length !== requestedPermissionIds.length) {
        const existingIds = new Set(requestedPermissions.map(({ id }) => id));
        const missingIds = requestedPermissionIds.filter(
          (id) => !existingIds.has(id),
        );

        throw new BadRequestException(
          `Unknown permission IDs: ${missingIds.join(', ')}`,
        );
      }

      const rolePermissionRepository = manager.getRepository(RolePermission);
      const currentAssignments = await rolePermissionRepository.findBy({
        roleId,
      });
      const currentIds = new Set(
        currentAssignments.map(({ permissionId }) => permissionId),
      );
      const requestedIds = new Set(requestedPermissionIds);
      const idsToRemove = [...currentIds].filter((id) => !requestedIds.has(id));
      const idsToAdd = requestedPermissionIds.filter((id) => !currentIds.has(id));

      if (role.name === 'admin' && (idsToAdd.length > 0 || idsToRemove.length > 0)) {
        await this.ensureAdminManagementPermissions(
          permissionRepository,
          requestedIds,
        );
      }

      if (idsToRemove.length === 0 && idsToAdd.length === 0) {
        return this.loadRolePermissions(manager, roleId);
      }

      if (idsToRemove.length > 0) {
        await rolePermissionRepository.delete({
          roleId,
          permissionId: In(idsToRemove),
        });
      }

      if (idsToAdd.length > 0) {
        await rolePermissionRepository.save(
          idsToAdd.map((permissionId) =>
            rolePermissionRepository.create({
              roleId,
              permissionId,
              assignedBy,
            }),
          ),
        );
      }

      role.permissionsVersion += 1;
      await manager.getRepository(Role).save(role);

      return this.loadRolePermissions(manager, roleId);
    });
  }

  private async ensureAdminManagementPermissions(
    permissionRepository: Repository<Permission>,
    requestedIds: Set<number>,
  ): Promise<void> {
    const requiredPermissions = await permissionRepository.findBy({
      name: In([...ADMIN_REQUIRED_PERMISSIONS]),
    });

    if (requiredPermissions.length !== ADMIN_REQUIRED_PERMISSIONS.length) {
      throw new ConflictException(
        'Required permissions for managing authorization are not available',
      );
    }

    const missingNames = requiredPermissions
      .filter(({ id }) => !requestedIds.has(id))
      .map(({ name }) => name);

    if (missingNames.length > 0) {
      throw new ConflictException(
        `The admin role must retain these permissions: ${missingNames.join(', ')}`,
      );
    }

  }

  private async loadRolePermissions(
    manager: EntityManager,
    roleId: number,
  ): Promise<RolePermissionsResponse> {
    const role = await manager.getRepository(Role).findOne({
      where: { id: roleId },
      relations: { rolePermissions: { permission: true } },
    });

    if (!role) {
      throw new NotFoundException(`Role ${roleId} was not found`);
    }

    return {
      id: role.id,
      name: role.name,
      permissionsVersion: role.permissionsVersion,
      permissions: (role.rolePermissions ?? [])
        .map(({ permission }) => permission)
        .filter((permission): permission is Permission => Boolean(permission))
        .map(({ id, name, description }) => ({ id, name, description }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }
}
