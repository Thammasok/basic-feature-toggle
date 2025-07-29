import { Request, Response, NextFunction } from 'express'
import { FeatureToggleService } from '../services/feature-toggle.service'

const featureToggleService = new FeatureToggleService()

export const requireFeature = (featureId: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isEnabled = await featureToggleService.isFeatureEnabled(featureId)

      if (!isEnabled) {
        return res.status(503).json({
          error: 'Feature temporarily unavailable',
          message: `The ${featureId} feature is currently disabled`,
          code: 'FEATURE_DISABLED',
        })
      }

      next()
    } catch (error) {
      console.error(`Feature toggle middleware error:`, error)
      // Fail-safe: deny access if there's an error
      return res.status(503).json({
        error: 'Service temporarily unavailable',
        message: 'Unable to verify feature availability',
        code: 'SERVICE_ERROR',
      })
    }
  }
}
