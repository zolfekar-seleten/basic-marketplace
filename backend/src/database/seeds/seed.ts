import 'reflect-metadata';
import 'dotenv/config';

import dataSource from '../data-source';
import { getAdminSeedConfig, seedAdmin } from './admin.seed';
import { seedCategories } from './categories.seed';
import { seedPermissions } from './permissions.seed';
import { seedRolePermissions } from './role-permissions.seed';
import { seedRoles } from './roles.seed';

async function seed(): Promise<void> {
  try {
    const adminConfig = getAdminSeedConfig();

    dataSource.setOptions({ logging: false });
    await dataSource.initialize();
    await dataSource.transaction(async (manager) => {
      const roles = await seedRoles(manager);
      const permissions = await seedPermissions(manager);
      const adminRole = roles.get('admin');

      if (!adminRole) {
        throw new Error('The admin role was not created');
      }

      const adminUser = await seedAdmin(manager, adminConfig, adminRole);
      await seedRolePermissions(
        manager,
        roles,
        permissions,
        adminUser.id,
      );
      await seedCategories(manager);
    });

    console.info('Database seeding completed successfully.');
  } catch (error) {
    console.error(
      'Database seeding failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void seed();
