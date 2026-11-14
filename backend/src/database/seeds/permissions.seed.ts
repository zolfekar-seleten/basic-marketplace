import { EntityManager } from 'typeorm';

import { Permission } from '../../permissions/entities/permission.entity';

export const permissionNames = [
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
] as const;

export type PermissionName = (typeof permissionNames)[number];

export async function seedPermissions(
  manager: EntityManager,
): Promise<Map<PermissionName, Permission>> {
  const repository = manager.getRepository(Permission);

  for (const name of permissionNames) {
    const permission = await repository.findOneBy({ name });

    if (!permission) {
      await repository.save(repository.create({ name, description: null }));
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
