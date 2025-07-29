import { Router } from 'express'
import { FeatureToggleController } from '../controllers/feature-toggle.controller'

const router = Router()
const controller = new FeatureToggleController()

// Admin routes for managing feature toggles
router.get('/features', controller.getAllFeatures.bind(controller))
router.get('/features/:featureId', controller.checkFeature.bind(controller))
router.patch('/features/:featureId', controller.toggleFeature.bind(controller))
router.post('/kill-switch', controller.killSwitch.bind(controller))

export { router as featureToggleRoutes }
