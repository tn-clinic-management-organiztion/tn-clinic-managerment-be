import { DataSource } from 'typeorm';
import AppDataSource from '../config/typeorm.config';

async function resetDatabase() {
  let dataSource: DataSource | null = null;

  try {
    dataSource = await AppDataSource.initialize();
    console.log('Database connection established\n');

    const queryRunner = dataSource.createQueryRunner();

    // Xóa tất cả tables
    console.log('Dropping all tables...');
    await queryRunner.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    // Xóa tất cả ENUM types
    console.log('Dropping all ENUM types...');
    await queryRunner.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (
          SELECT t.typname
          FROM pg_type t
          LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
          WHERE (t.typrelid = 0 OR (SELECT c.relkind = 'c' FROM pg_catalog.pg_class c WHERE c.oid = t.typrelid))
          AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_type el WHERE el.oid = t.typelem AND el.typarray = t.oid)
          AND n.nspname = 'public'
          AND t.typtype = 'e'
        ) LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    // Xóa tất cả sequences
    console.log('Dropping all sequences...');
    await queryRunner.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
          EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    await queryRunner.release();

    console.log('Database reset successfully!\n');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  } finally {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
      console.log('✓ Database connection closed');
    }
  }
}

resetDatabase();
