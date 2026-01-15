import { SeedDataSource } from './../config/typeorm-seed.config';

import { DataSource } from 'typeorm';
import { MainSeeder } from './seeds';

async function runSeed() {
    let dataSource: DataSource | null = null;

  try {
    dataSource = await SeedDataSource.initialize();
    console.log('Database connection established\n');

    const seeder = new MainSeeder();
    await seeder.run(dataSource);

  } catch (error) {
    console.error('Error running seed:', error);
    process.exit(1);
  } finally {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
      console.log('\nDatabase connection closed');
    }
  }
}

runSeed();