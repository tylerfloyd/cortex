import 'dotenv/config';
import { db } from './index';
import { categories } from './schema';

const defaultCategories = [
  {
    name: 'AI/ML',
    slug: 'ai-ml',
    color: '#6366f1',
  },
  {
    name: 'Web Development',
    slug: 'web-development',
    color: '#0ea5e9',
  },
  {
    name: 'Business',
    slug: 'business',
    color: '#10b981',
  },
  {
    name: 'DevOps',
    slug: 'devops',
    color: '#f59e0b',
  },
  {
    name: 'Uncategorized',
    slug: 'uncategorized',
    color: '#6b7280',
  },
];

async function seed() {
  console.log('Seeding default categories...');

  for (const category of defaultCategories) {
    await db
      .insert(categories)
      .values(category)
      .onConflictDoNothing();
  }

  console.log('Seeding complete.');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
