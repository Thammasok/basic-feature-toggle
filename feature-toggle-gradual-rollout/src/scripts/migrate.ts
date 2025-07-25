import { pool } from '../database/connection';
import fs from 'fs';
import path from 'path';

async function runMigrations(): Promise<void> {
  try {
    console.log('🔄 Running database migrations...');

    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);

    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}