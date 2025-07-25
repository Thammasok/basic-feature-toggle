import { Request, Response } from 'express';
import { FeatureToggle } from '../middleware/feature-toggle.middleware';

export class DashboardController {
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboardData = FeatureToggle.isEnabled('enableNewDashboard')
        ? await DashboardController.getNewDashboard()
        : await DashboardController.getLegacyDashboard();

      // Add beta features if enabled
      if (FeatureToggle.isEnabled('enableBetaFeatures')) {
        dashboardData.betaFeatures = await DashboardController.getBetaFeatures();
      }

      // Add dark mode support
      if (FeatureToggle.isEnabled('enableDarkMode')) {
        dashboardData.theme = req.query.theme || 'light';
        dashboardData.supportsDarkMode = true;
      }

      res.json({
        success: true,
        data: dashboardData,
        features: {
          newDashboard: FeatureToggle.isEnabled('enableNewDashboard'),
          betaFeatures: FeatureToggle.isEnabled('enableBetaFeatures'),
          darkMode: FeatureToggle.isEnabled('enableDarkMode')
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to load dashboard'
      });
    }
  }

  private static async getNewDashboard(): Promise<any> {
    return {
      version: '2.0',
      layout: 'modern',
      widgets: ['analytics', 'quick-actions', 'recent-activity', 'notifications'],
      features: ['real-time-updates', 'customizable-layout', 'advanced-charts']
    };
  }

  private static async getLegacyDashboard(): Promise<any> {
    return {
      version: '1.0',
      layout: 'classic',
      widgets: ['basic-stats', 'simple-charts'],
      features: ['basic-navigation']
    };
  }

  private static async getBetaFeatures(): Promise<any[]> {
    return [
      { name: 'AI Assistant', enabled: true },
      { name: 'Voice Commands', enabled: false },
      { name: 'Predictive Analytics', enabled: true }
    ];
  }
}
