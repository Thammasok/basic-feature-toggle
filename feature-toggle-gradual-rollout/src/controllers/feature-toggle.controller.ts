import { Request, Response } from 'express'
import { GradualRolloutService } from '../services/gradual-rollout.service'
import { FeatureFlagRepository } from '../repositories/feature-flag.repository'
import { User } from '../types/feature-toggle'

export class FeatureToggleController {
  private rolloutService: GradualRolloutService
  private featureFlagRepo: FeatureFlagRepository

  constructor() {
    this.rolloutService = new GradualRolloutService()
    this.featureFlagRepo = new FeatureFlagRepository()
  }

  // Check if feature is enabled for user
  checkFeature = async (req: Request, res: Response): Promise<void> => {
    try {
      const { featureName } = req.params
      const user: User = req.body.user || {
        id: (req.headers['x-user-id'] as string) || 'anonymous',
        email: (req.headers['x-user-email'] as string) || '',
        role: (req.headers['x-user-role'] as string) || 'user',
        segment: req.headers['x-user-segment'] as string,
        registrationDate: req.headers['x-user-registration']
          ? new Date(req.headers['x-user-registration'] as string)
          : new Date(),
      }

      const enabled = await this.rolloutService.isFeatureEnabled(featureName, user)

      res.json({
        feature: featureName,
        enabled,
        user: user.id,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error checking feature:', error)
      res.status(500).json({
        error: 'Failed to check feature flag',
        feature: req.params.featureName,
        enabled: false,
      })
    }
  }

  // Get all feature flags
  getAllFeatures = async (req: Request, res: Response): Promise<void> => {
    try {
      const environment = (req.query.environment as string) || 'production'
      const features = await this.featureFlagRepo.getAllFeatureFlags(environment)

      res.json({
        success: true,
        environment,
        features,
        count: features.length,
      })
    } catch (error) {
      console.error('Error fetching features:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch feature flags',
      })
    }
  }

  // Create or update feature flag
  upsertFeature = async (req: Request, res: Response): Promise<void> => {
    try {
      const featureData = req.body
      const feature = await this.featureFlagRepo.upsertFeatureFlag(featureData)

      res.json({
        success: true,
        feature,
        message: 'Feature flag updated successfully',
      })
    } catch (error) {
      console.error('Error upserting feature:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update feature flag',
      })
    }
  }

  // Update rollout percentage
  updateRollout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { featureName } = req.params
      const { percentage } = req.body
      const changedBy = (req.headers['x-user-id'] as string) || 'system'

      if (percentage < 0 || percentage > 100) {
        res.status(400).json({
          success: false,
          error: 'Percentage must be between 0 and 100',
        })
        return
      }

      await this.featureFlagRepo.updateRolloutPercentage(featureName, percentage, changedBy)

      res.json({
        success: true,
        message: `Rollout percentage updated to ${percentage}% for ${featureName}`,
      })
    } catch (error) {
      console.error('Error updating rollout:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to update rollout percentage',
      })
    }
  }

  // Start gradual rollout
  startGradualRollout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { featureName } = req.params
      const { stages } = req.body

      const plan = await this.rolloutService.createRolloutPlan(featureName, stages)

      // Execute rollout in background (in production, use job queue)
      this.rolloutService.executeGradualRollout(plan).catch((error) => {
        console.error('Gradual rollout failed:', error)
      })

      res.json({
        success: true,
        message: 'Gradual rollout started',
        plan: {
          feature: plan.featureName,
          stages: plan.stages.length,
          totalDuration: plan.totalDuration,
          estimatedCompletion: new Date(Date.now() + plan.totalDuration),
        },
      })
    } catch (error) {
      console.error('Error starting gradual rollout:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to start gradual rollout',
      })
    }
  }

  // Get feature analytics
  getAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { featureName } = req.params
      const days = parseInt(req.query.days as string) || 7

      const analytics = await this.rolloutService.getFeatureAnalytics(featureName, days)

      res.json({
        success: true,
        feature: featureName,
        period: `${days} days`,
        analytics,
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch feature analytics',
      })
    }
  }

  // Get user segments
  getSegments = async (req: Request, res: Response): Promise<void> => {
    try {
      const segments = await this.featureFlagRepo.getUserSegments()

      res.json({
        success: true,
        segments,
        count: segments.length,
      })
    } catch (error) {
      console.error('Error fetching segments:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user segments',
      })
    }
  }
}
