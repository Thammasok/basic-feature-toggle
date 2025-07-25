import { FeatureFlags, featureFlags } from './config/feature-flags'

export class FeatureToggle {
  private static flags = featureFlags

  // Check if a feature is enabled
  static isEnabled(featureName: keyof FeatureFlags): boolean {
    return this.flags[featureName]
  }

  // Get all enabled features
  static getEnabledFeatures(): string[] {
    return Object.entries(this.flags)
      .filter(([_, enabled]) => enabled)
      .map(([feature, _]) => feature)
  }

  // Get all disabled features
  static getDisabledFeatures(): string[] {
    return Object.entries(this.flags)
      .filter(([_, enabled]) => !enabled)
      .map(([feature, _]) => feature)
  }

  // Get feature flag summary
  static getSummary(): { total: number; enabled: number; disabled: number } {
    const total = Object.keys(this.flags).length
    const enabled = this.getEnabledFeatures().length
    const disabled = total - enabled

    return { total, enabled, disabled }
  }

  // Validate environment configuration
  static validateConfig(): { valid: boolean; missingVars: string[] } {
    const requiredVars = [
      'ENABLE_NEW_DATABASE',
      'ENABLE_TWO_FACTOR_AUTH',
      'ENABLE_NEW_DASHBOARD',
      'ENABLE_ANALYTICS',
    ]

    const missingVars = requiredVars.filter((varName) => process.env[varName] === undefined)

    return {
      valid: missingVars.length === 0,
      missingVars,
    }
  }

  // Log current configuration (for debugging)
  static logConfiguration(): void {
    if (this.isEnabled('enableDebugMode')) {
      console.log('🚀 Feature Flags Configuration:')
      console.log('=====================================')

      Object.entries(this.flags).forEach(([feature, enabled]) => {
        const status = enabled ? '✅ ON ' : '❌ OFF'
        console.log(`${status} ${feature}`)
      })

      const summary = this.getSummary()
      console.log('=====================================')
      console.log(
        `Total: ${summary.total} | Enabled: ${summary.enabled} | Disabled: ${summary.disabled}`
      )
      console.log('=====================================\n')
    }
  }
}
