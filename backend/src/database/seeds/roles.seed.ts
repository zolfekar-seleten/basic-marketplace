import { EntityManager } from 'typeorm';

import { Role } from '../../roles/entities/role.entity';

const roles = [
  { name: 'admin', description: 'System administrator' },
  { name: 'buyer', description: 'Customer who purchases products' },
  { name: 'supplier', description: 'Supplier who manages products and orders' },
] as const;

export async function seedRoles(
  manager: EntityManager,
): Promise<Map<string, Role>> {
  const repository = manager.getRepository(Role);

  for (const roleSeed of roles) {
    let role = await repository.findOneBy({ name: roleSeed.name });

    if (!role) {
      role = repository.create(roleSeed);
    } else if (role.description !== roleSeed.description) {
      role.description = roleSeed.description;
    }

    await repository.save(role);
  }

  const seededRoles = await repository.findBy(
    roles.map(({ name }) => ({ name })),
  );

  return new Map(seededRoles.map((role) => [role.name, role]));
}
