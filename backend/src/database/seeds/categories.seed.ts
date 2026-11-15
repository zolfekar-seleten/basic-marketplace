import { EntityManager } from 'typeorm';

import { Category } from '../../categories/entities/category.entity';

const categories = [
  {
    name: 'Electronics',
    description: 'Electronic devices and accessories',
  },
  { name: 'Furniture', description: 'Office and home furniture' },
  { name: 'Clothing', description: 'Apparel and accessories' },
  { name: 'Food & Beverages', description: 'Food and beverage products' },
  { name: 'Office Supplies', description: 'Office equipment and supplies' },
] as const;

function normalizeCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export async function seedCategories(manager: EntityManager): Promise<void> {
  const repository = manager.getRepository(Category);

  for (const categorySeed of categories) {
    const name = normalizeCategoryName(categorySeed.name);
    const existing = await repository
      .createQueryBuilder('category')
      .where('LOWER(BTRIM(category.name)) = :name', {
        name: name.toLowerCase(),
      })
      .getOne();

    if (!existing) {
      await repository.save(
        repository.create({ name, description: categorySeed.description }),
      );
    }
  }
}
