import { pool } from '../database/connection';
import { FeatureFlag, UserSegment, FeatureTargeting, UserFeatureAssignment } from '../types/feature-toggle';

export class FeatureFlagRepository {
  // Get all feature flags
  async getAllFeatureFlags(environment: string = 'production'): Promise<FeatureFlag[]> {
    const query = `
      SELECT id, name, description, enabled, rollout_percentage as "rolloutPercentage",
             rollout_strategy as "rolloutStrategy", environment,
             created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
      FROM feature_flags 
      WHERE environment = $1 
      ORDER BY name
    `;

    const result = await pool.query(query, [environment]);
    return result.rows;
  }

  // Get feature flag by name
  async getFeatureFlagByName(name: string, environment: string = 'production'): Promise<FeatureFlag | null> {
    const query = `
      SELECT id, name, description, enabled, rollout_percentage as "rolloutPercentage",
             rollout_strategy as "rolloutStrategy", environment,
             created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
      FROM feature_flags 
      WHERE name = $1 AND environment = $2
    `;

    const result = await pool.query(query, [name, environment]);
    return result.rows[0] || null;
  }

  // Create or update feature flag
  async upsertFeatureFlag(featureFlag: Partial<FeatureFlag>): Promise<FeatureFlag> {
    const query = `
      INSERT INTO feature_flags (name, description, enabled, rollout_percentage, rollout_strategy, environment, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (name) 
      DO UPDATE SET 
        description = EXCLUDED.description,
        enabled = EXCLUDED.enabled,
        rollout_percentage = EXCLUDED.rollout_percentage,
        rollout_strategy = EXCLUDED.rollout_strategy,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, name, description, enabled, rollout_percentage as "rolloutPercentage",
                rollout_strategy as "rolloutStrategy", environment,
                created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy"
    `;

    const values = [
      featureFlag.name,
      featureFlag.description,
      featureFlag.enabled,
      featureFlag.rolloutPercentage,
      featureFlag.rolloutStrategy,
      featureFlag.environment,
      featureFlag.createdBy
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update rollout percentage
  async updateRolloutPercentage(name: string, percentage: number, changedBy?: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current values for history
      const currentResult = await client.query(
        'SELECT * FROM feature_flags WHERE name = $1',
        [name]
      );

      if (currentResult.rows.length === 0) {
        throw new Error(`Feature flag '${name}' not found`);
      }

      const currentFlag = currentResult.rows[0];

      // Update the flag
      await client.query(
        'UPDATE feature_flags SET rollout_percentage = $1, updated_at = CURRENT_TIMESTAMP WHERE name = $2',
        [percentage, name]
      );

      // Record in history
      await client.query(`
        INSERT INTO feature_flag_history (feature_flag_id, action, old_values, new_values, changed_by)
        VALUES ($1, 'rollout_updated', $2, $3, $4)
      `, [
        currentFlag.id,
        JSON.stringify({ rollout_percentage: currentFlag.rollout_percentage }),
        JSON.stringify({ rollout_percentage: percentage }),
        changedBy
      ]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user segments
  async getUserSegments(): Promise<UserSegment[]> {
    const query = `
      SELECT id, name, description, criteria, created_at as "createdAt"
      FROM user_segments 
      ORDER BY name
    `;

    const result = await pool.query(query);
    return result.rows.map(row => ({
      ...row,
      criteria: typeof row.criteria === 'string' ? JSON.parse(row.criteria) : row.criteria
    }));
  }

  // Get targeting rules for a feature
  async getFeatureTargeting(featureFlagId: number): Promise<FeatureTargeting[]> {
    const query = `
      SELECT ft.id, ft.feature_flag_id as "featureFlagId", ft.segment_id as "segmentId",
             ft.enabled, ft.rollout_percentage as "rolloutPercentage", ft.created_at as "createdAt"
      FROM feature_targeting ft
      WHERE ft.feature_flag_id = $1
    `;

    const result = await pool.query(query, [featureFlagId]);
    return result.rows;
  }

  // Get or create user feature assignment
  async getUserFeatureAssignment(userId: string, featureFlagId: number): Promise<UserFeatureAssignment | null> {
    const query = `
      SELECT id, user_id as "userId", feature_flag_id as "featureFlagId",
             assigned, assigned_at as "assignedAt", assignment_reason as "assignmentReason"
      FROM user_feature_assignments 
      WHERE user_id = $1 AND feature_flag_id = $2
    `;

    const result = await pool.query(query, [userId, featureFlagId]);
    return result.rows[0] || null;
  }

  // Create user feature assignment
  async createUserFeatureAssignment(
    userId: string,
    featureFlagId: number,
    assigned: boolean,
    reason: string
  ): Promise<UserFeatureAssignment> {
    const query = `
      INSERT INTO user_feature_assignments (user_id, feature_flag_id, assigned, assignment_reason)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, feature_flag_id)
      DO UPDATE SET assigned = EXCLUDED.assigned, assignment_reason = EXCLUDED.assignment_reason
      RETURNING id, user_id as "userId", feature_flag_id as "featureFlagId",
                assigned, assigned_at as "assignedAt", assignment_reason as "assignmentReason"
    `;

    const result = await pool.query(query, [userId, featureFlagId, assigned, reason]);
    return result.rows[0];
  }

  // Record feature analytics
  async recordFeatureAnalytics(
    featureFlagId: number,
    userId: string,
    eventType: string,
    eventData?: Record<string, any>
  ): Promise<void> {
    const query = `
      INSERT INTO feature_analytics (feature_flag_id, user_id, event_type, event_data)
      VALUES ($1, $2, $3, $4)
    `;

    await pool.query(query, [featureFlagId, userId, eventType, eventData ? JSON.stringify(eventData) : null]);
  }

  // Get feature usage analytics
  async getFeatureAnalytics(featureFlagId: number, days: number = 7): Promise<any[]> {
    const query = `
      SELECT event_type, COUNT(*) as count, DATE(timestamp) as date
      FROM feature_analytics 
      WHERE feature_flag_id = $1 AND timestamp >= NOW() - INTERVAL '${days} days'
      GROUP BY event_type, DATE(timestamp)
      ORDER BY date DESC, event_type
    `;

    const result = await pool.query(query, [featureFlagId]);
    return result.rows;
  }
}