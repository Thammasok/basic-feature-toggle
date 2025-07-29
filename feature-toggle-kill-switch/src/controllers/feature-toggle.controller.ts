import { Request, Response } from 'express'
import { FeatureToggleService } from '../services/feature-toggle.service'

export class FeatureToggleController {
  private featureToggleService: FeatureToggleService

  constructor() {
    this.featureToggleService = new FeatureToggleService()
  }

  async getAllFeatures(req: Request, res: Response) {
    try {
      const features = await this.featureToggleService.getAllFeatures()
      res.json(features)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch features' })
    }
  }

  async toggleFeature(req: Request, res: Response) {
    try {
      const { featureId } = req.params
      const { enabled } = req.body

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'enabled must be a boolean' })
      }

      const success = await this.featureToggleService.toggleFeature(featureId, enabled)

      if (success) {
        res.json({
          message: `Feature ${featureId} ${enabled ? 'enabled' : 'disabled'}`,
          featureId,
          enabled,
        })
      } else {
        res.status(404).json({ error: 'Feature not found' })
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to toggle feature' })
    }
  }

  async checkFeature(req: Request, res: Response) {
    try {
      const { featureId } = req.params
      const enabled = await this.featureToggleService.isFeatureEnabled(featureId)

      res.json({ featureId, enabled })
    } catch (error) {
      res.status(500).json({ error: 'Failed to check feature' })
    }
  }

  async killSwitch(req: Request, res: Response) {
    try {
      const success = await this.featureToggleService.killAllFeatures()

      if (success) {
        res.json({
          message: 'Emergency kill switch activated - all features disabled',
          timestamp: new Date().toISOString(),
        })
      } else {
        res.status(500).json({ error: 'Failed to activate kill switch' })
      }
    } catch (error) {
      res.status(500).json({ error: 'Kill switch operation failed' })
    }
  }
}
