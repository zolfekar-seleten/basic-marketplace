import { EntityManager } from 'typeorm';

import { Permission } from '../../permissions/entities/permission.entity';
import { RolePermission } from '../../roles/entities/role-permission.entity';
import { Role } from '../../roles/entities/role.entity';
import { PermissionName } from './permissions.seed';

const permissionsByRole: Record<string, readonly PermissionName[]> = {
  buyer: [
    'products.view',
    'cart.manage',
    'orders.create',
    'orders.view_own',
  ],
  supplier: [
    'products.view',
    'products.create',
    'products.update',
    'products.delete',
    'orders.view_supplier',
    'orders.update_status',
  ],
  admin: [
    'products.view',
    'products.create',
    'products.update',
    'products.delete',
    'cart.manage',
    'orders.create',
    'orders.view_own',
    'orders.view_supplier',
    'orders.update_status',
    'users.manage',
    'suppliers.create',
    'categories.manage',
    'permissions.view',
    'permissions.create',
    'permissions.update',
    'permissions.delete',
    'roles.view',
    'roles.assign_permissions',
  ],
};

export async function seedRolePermissions(
  manager: EntityManager,
  roles: Map<string, Role>,
  permissions: Map<PermissionName, Permission>,
  adminUserId: number,
): Promise<void> {
  const repository = manager.getRepository(RolePermission);
  const changedRoleNames = new Set<string>();

  for (const [roleName, permissionNames] of Object.entries(permissionsByRole)) {
    const role = roles.get(roleName);

    if (!role) {
      throw new Error(`Role ${roleName} was not found while assigning permissions`);
    }

    for (const permissionName of permissionNames) {
      const permission = permissions.get(permissionName);

      if (!permission) {
        throw new Error(
          `Permission ${permissionName} was not found while assigning permissions`,
        );
      }

      const assignment = await repository.findOneBy({
        roleId: role.id,
        permissionId: permission.id,
      });

      if (!assignment) {
        await repository.save(
          repository.create({
            roleId: role.id,
            permissionId: permission.id,
            assignedBy: adminUserId,
          }),
        );
        changedRoleNames.add(roleName);
      }
    }
  }

  const roleRepository = manager.getRepository(Role);

  for (const roleName of changedRoleNames) {
    const role = roles.get(roleName);

    if (role) {
      role.permissionsVersion += 1;
      await roleRepository.save(role);
    }
  }
}
