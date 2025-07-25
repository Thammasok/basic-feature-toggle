import { Router } from 'express';
import { FeatureToggleController } from '../controllers/feature-toggle.controller';

const router = Router();
const controller = new FeatureToggleController();

// Feature flag routes
router.get('/features', controller.getAllFeatures);
router.post('/features', controller.upsertFeature);
router.get('/features/:featureName/check', controller.checkFeature);
router.post('/features/:featureName/check', controller.checkFeature);
router.put('/features/:featureName/rollout', controller.updateRollout);
router.post('/features/:featureName/gradual-rollout', controller.startGradualRollout);
router.get('/features/:featureName/analytics', controller.getAnalytics);

// User segments
router.get('/segments', controller.getSegments);

export default router;