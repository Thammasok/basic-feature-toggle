import { pool } from '../database/connection'
import { FeatureToggle } from '../types/feature-toggle'

export class FeatureToggleService {
  private cache: Map<string, boolean> = new Map()
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_TTL = 30000 // 30 seconds

  async isFeatureEnabled(featureId: string): Promise<boolean> {
    // Check cache first
    const cached = this.getCachedValue(featureId)
    if (cached !== null) {
      return cached
    }

    try {
      const result = await pool.query('SELECT enabled FROM feature_toggles WHERE id = $1', [
        featureId,
      ])

      const enabled = result.rows.length > 0 ? result.rows[0].enabled : false

      // Cache the result
      this.setCachedValue(featureId, enabled)

      return enabled
    } catch (error) {
      console.error(`Error checking feature toggle ${featureId}:`, error)
      // Fail-safe: return false if database is unavailable
      return false
    }
  }

  async toggleFeature(featureId: string, enabled: boolean): Promise<boolean> {
    try {
      const result = await pool.query(
        `UPDATE feature_toggles 
         SET enabled = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [enabled, featureId]
      )

      if (result.rows.length > 0) {
        // Clear cache for this feature
        this.clearCachedValue(featureId)
        return true
      }
      return false
    } catch (error) {
      console.error(`Error toggling feature ${featureId}:`, error)
      return false
    }
  }

  async getAllFeatures(): Promise<FeatureToggle[]> {
    try {
      const result = await pool.query('SELECT * FROM feature_toggles ORDER BY name')
      return result.rows
    } catch (error) {
      console.error('Error fetching all features:', error)
      return []
    }
  }

  async createFeature(feature: Omit<FeatureToggle, 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      await pool.query(
        `INSERT INTO feature_toggles (id, name, enabled, description) 
         VALUES ($1, $2, $3, $4)`,
        [feature.id, feature.name, feature.enabled, feature.description]
      )
      return true
    } catch (error) {
      console.error('Error creating feature:', error)
      return false
    }
  }

  // Emergency kill switch - disable all features
  async killAllFeatures(): Promise<boolean> {
    try {
      await pool.query('UPDATE feature_toggles SET enabled = false')
      this.clearAllCache()
      console.log('EMERGENCY: All features have been disabled')
      return true
    } catch (error) {
      console.error('Error in kill switch:', error)
      return false
    }
  }

  private getCachedValue(featureId: string): boolean | null {
    const expiry = this.cacheExpiry.get(featureId)
    if (expiry && Date.now() < expiry) {
      return this.cache.get(featureId) || false
    }
    this.clearCachedValue(featureId)
    return null
  }

  private setCachedValue(featureId: string, value: boolean): void {
    this.cache.set(featureId, value)
    this.cacheExpiry.set(featureId, Date.now() + this.CACHE_TTL)
  }

  private clearCachedValue(featureId: string): void {
    this.cache.delete(featureId)
    this.cacheExpiry.delete(featureId)
  }

  private clearAllCache(): void {
    this.cache.clear()
    this.cacheExpiry.clear()
  }
}
