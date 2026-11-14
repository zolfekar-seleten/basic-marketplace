import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Role } from '../../roles/entities/role.entity';
import { User } from '../../users/entities/user.entity';

export interface AdminSeedConfig {
  name: string;
  email: string;
  password: string;
}

export function getAdminSeedConfig(
  environment: NodeJS.ProcessEnv = process.env,
): AdminSeedConfig {
  const name = environment.ADMIN_NAME?.trim();
  const email = environment.ADMIN_EMAIL?.trim().toLowerCase();
  const password = environment.ADMIN_PASSWORD;

  if (!name || !email || !password?.trim()) {
    throw new Error(
      'ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must all be configured and non-empty',
    );
  }

  if (name.length > 150 || email.length > 255) {
    throw new Error('ADMIN_NAME or ADMIN_EMAIL exceeds the database column limit');
  }

  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('ADMIN_PASSWORD must be at most 72 bytes when UTF-8 encoded');
  }

  return { name, email, password };
}

export async function seedAdmin(
  manager: EntityManager,
  adminConfig: AdminSeedConfig,
  adminRole: Role,
): Promise<User> {
  const repository = manager.getRepository(User);
  const matchingUsers = await repository
    .createQueryBuilder('user')
    .leftJoinAndSelect('user.role', 'role')
    .where('LOWER(BTRIM(user.email)) = :email', { email: adminConfig.email })
    .getMany();

  if (matchingUsers.length > 1) {
    throw new Error(
      `Multiple users match configured admin email ${adminConfig.email}`,
    );
  }

  const existingUser = matchingUsers[0];

  if (existingUser) {
    if (existingUser.role?.name !== 'admin') {
      throw new Error(
        `Configured admin email ${adminConfig.email} belongs to a non-admin user; refusing to change the user's role`,
      );
    }

    return existingUser;
  }

  const existingAdmin = await repository.findOneBy({ roleId: adminRole.id });

  if (existingAdmin) {
    throw new Error(
      `An admin user with a different email already exists; refusing to create an additional admin account`,
    );
  }

  const password = await bcrypt.hash(adminConfig.password, 12);
  const admin = repository.create({
    name: adminConfig.name,
    email: adminConfig.email,
    password,
    roleId: adminRole.id,
    role: adminRole,
  });

  return repository.save(admin);
}
