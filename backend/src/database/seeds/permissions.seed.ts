import { EntityManager } from 'typeorm';

import { Permission } from '../../permissions/entities/permission.entity';

export const permissionDefinitions = [
  { name: 'products.view', description: null },
  { name: 'products.create', description: null },
  { name: 'products.update', description: null },
  { name: 'products.delete', description: null },
  { name: 'cart.manage', description: null },
  { name: 'orders.create', description: null },
  { name: 'orders.view_own', description: null },
  { name: 'orders.view_supplier', description: null },
  { name: 'orders.update_status', description: null },
  { name: 'users.manage', description: null },
  { name: 'suppliers.create', description: null },
  { name: 'categories.manage', description: null },
  { name: 'permissions.view', description: 'View available permissions' },
  { name: 'permissions.create', description: 'Create permissions' },
  {
    name: 'permissions.update',
    description: 'Update permission descriptions',
  },
  { name: 'permissions.delete', description: 'Delete permissions' },
  { name: 'roles.view', description: 'View roles and their permissions' },
  {
    name: 'roles.assign_permissions',
    description: 'Assign or revoke permissions from roles',
  },
  { name: 'categories.view', description: 'View marketplace categories' },
  { name: 'categories.create', description: 'Create marketplace categories' },
  { name: 'categories.update', description: 'Update marketplace categories' },
  { name: 'categories.delete', description: 'Delete marketplace categories' },
] as const;

export const permissionNames = permissionDefinitions.map(
  ({ name }) => name,
) as readonly (typeof permissionDefinitions)[number]['name'][];

export type PermissionName = (typeof permissionNames)[number];

export async function seedPermissions(
  manager: EntityManager,
): Promise<Map<PermissionName, Permission>> {
  const repository = manager.getRepository(Permission);

  for (const { name, description } of permissionDefinitions) {
    const permission = await repository.findOneBy({ name });

    if (!permission) {
      await repository.save(repository.create({ name, description }));
    }
  }

  const seededPermissions = await repository.findBy(
    permissionNames.map((name) => ({ name })),
  );

  return new Map(
    seededPermissions.map((permission) => [
      permission.name as PermissionName,
      permission,
    ]),
  );
}
