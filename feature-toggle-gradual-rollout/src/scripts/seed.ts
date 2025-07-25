import { pool } from '../database/connection';

async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Seeding database with sample data...');

    // Insert sample feature flags
    await pool.query(`
      INSERT INTO feature_flags (name, description, enabled, rollout_percentage, rollout_strategy, environment, created_by)
      VALUES 
        ('new_dashboard', 'New user dashboard with modern UI', true, 25, 'percentage', 'production', 'admin'),
        ('payment_v2', 'New payment processing system', true, 10, 'gradual', 'production', 'admin'),
        ('beta_search', 'Beta version of search functionality', true, 50, 'segment', 'production', 'admin'),
        ('dark_mode', 'Dark mode theme support', true, 75, 'percentage', 'production', 'admin'),
        ('advanced_analytics', 'Advanced analytics dashboard', false, 0, 'percentage', 'production', 'admin')
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert sample user segments
    await pool.query(`
      INSERT INTO user_segments (name, description, criteria)
      VALUES 
        ('premium_users', 'Users with premium subscription', '{"role": ["premium", "enterprise"]}'),
        ('beta_testers', 'Users who opted into beta testing', '{"metadata": {"beta_tester": true}}'),
        ('early_adopters', 'Users registered in the last 30 days', '{"registrationDateAfter": "2024-01-01"}'),
        ('power_users', 'Users with high engagement', '{"customRules": [{"field": "login_count", "operator": "greater_than", "value": 50}]}')
      ON CONFLICT (name) DO NOTHING
    `);

    // Get feature and segment IDs for targeting rules
    const featureResult = await pool.query('SELECT id, name FROM feature_flags WHERE name = $1', ['beta_search']);
    const segmentResult = await pool.query('SELECT id, name FROM user_segments WHERE name = $1', ['beta_testers']);

    if (featureResult.rows.length > 0 && segmentResult.rows.length > 0) {
      await pool.query(`
        INSERT INTO feature_targeting (feature_flag_id, segment_id, enabled, rollout_percentage)
        VALUES ($1, $2, true, 100)
        ON CONFLICT DO NOTHING
      `, [featureResult.rows[0].id, segmentResult.rows[0].id]);
    }

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedDatabase();
}