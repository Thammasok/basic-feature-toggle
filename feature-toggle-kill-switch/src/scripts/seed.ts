import { pool } from '../database/connection'

async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Seeding database with sample data...')

    // Insert sample feature flags
    await pool.query(`
      INSERT INTO feature_toggles (id, name, enabled, description) VALUES 
      ('user-registration', 'User Registration', true, 'Enable user registration feature'),
      ('payment-gateway', 'Payment Gateway', false, 'Enable payment processing'),
      ('email-notifications', 'Email Notifications', true, 'Enable email notification system'),
      ('beta-features', 'Beta Features', false, 'Enable beta features for testing')
    `)

    console.log('✅ Database seeded successfully')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

if (require.main === module) {
  seedDatabase()
}
