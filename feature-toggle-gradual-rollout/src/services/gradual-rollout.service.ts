import { FeatureFlagRepository } from '../repositories/feature-flag.repository';
import { User, FeatureFlag, RolloutPlan, RolloutStage } from '../types/feature-toggle';
import crypto from 'crypto';

export class GradualRolloutService {
  private featureFlagRepo: FeatureFlagRepository;
  private cache: Map<string, FeatureFlag> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = parseInt(process.env.FEATURE_CACHE_TTL || '300000'); // 5 minutes

  constructor() {
    this.featureFlagRepo = new FeatureFlagRepository();
    
    // Auto-refresh cache
    setInterval(() => {
      this.refreshCache();
    }, parseInt(process.env.ROLLOUT_UPDATE_INTERVAL || '60000')); // 1 minute
  }

  // Check if feature is enabled for user
  async isFeatureEnabled(featureName: string, user: User, environment: string = 'production'): Promise<boolean> {
    try {
      const featureFlag = await this.getFeatureFlag(featureName, environment);
      
      if (!featureFlag) {
        console.warn(`Feature flag '${featureName}' not found`);
        return false;
      }

      if (!featureFlag.enabled) {
        await this.recordAnalytics(featureFlag.id, user.id, 'disabled');
        return false;
      }

      // Check existing assignment first (for consistency)
      const existingAssignment = await this.featureFlagRepo.getUserFeatureAssignment(user.id, featureFlag.id);
      
      if (existingAssignment) {
        const result = existingAssignment.assigned;
        await this.recordAnalytics(featureFlag.id, user.id, result ? 'enabled' : 'disabled');
        return result;
      }

      // Determine assignment based on rollout strategy
      let assigned = false;
      let assignmentReason = '';

      switch (featureFlag.rolloutStrategy) {
        case 'percentage':
          assigned = this.isUserInPercentageRollout(user.id, featureFlag.rolloutPercentage);
          assignmentReason = `percentage_rollout_${featureFlag.rolloutPercentage}`;
          break;
          
        case 'segment':
          assigned = await this.isUserInSegmentRollout(user, featureFlag.id);
          assignmentReason = 'segment_based';
          break;
          
        case 'gradual':
          assigned = await this.isUserInGradualRollout(user, featureFlag);
          assignmentReason = 'gradual_rollout';
          break;
          
        default:
          assigned = featureFlag.rolloutPercentage >= 100;
          assignmentReason = 'default';
      }

      // Store assignment for consistency
      await this.featureFlagRepo.createUserFeatureAssignment(
        user.id, 
        featureFlag.id, 
        assigned, 
        assignmentReason
      );

      await this.recordAnalytics(featureFlag.id, user.id, assigned ? 'enabled' : 'disabled', {
        strategy: featureFlag.rolloutStrategy,
        percentage: featureFlag.rolloutPercentage
      });

      return assigned;
    } catch (error) {
      console.error(`Error checking feature '${featureName}' for user '${user.id}':`, error);
      return false;
    }
  }

  // Get feature flag with caching
  private async getFeatureFlag(name: string, environment: string): Promise<FeatureFlag | null> {
    const cacheKey = `${name}:${environment}`;
    const now = Date.now();

    // Check cache
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      return this.cache.get(cacheKey)!;
    }

    // Fetch from database
    const featureFlag = await this.featureFlagRepo.getFeatureFlagByName(name, environment);
    
    if (featureFlag) {
      this.cache.set(cacheKey, featureFlag);
      this.cacheExpiry.set(cacheKey, now + this.CACHE_TTL);
    }

    return featureFlag;
  }

  // Percentage-based rollout using consistent hashing
  private isUserInPercentageRollout(userId: string, percentage: number): boolean {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;

    // Create consistent hash for user
    const hash = crypto.createHash('md5').update(userId).digest('hex');
    const userPercentile = parseInt(hash.substring(0, 8), 16) % 100;
    
    return userPercentile < percentage;
  }

  // Segment-based rollout
  private async isUserInSegmentRollout(user: User, featureFlagId: number): Promise<boolean> {
    const targeting = await this.featureFlagRepo.getFeatureTargeting(featureFlagId);
    const segments = await this.featureFlagRepo.getUserSegments();

    for (const target of targeting) {
      if (!target.enabled) continue;

      const segment = segments.find(s => s.id === target.segmentId);
      if (!segment) continue;

      if (this.doesUserMatchSegment(user, segment.criteria)) {
        // User is in segment, check rollout percentage
        return this.isUserInPercentageRollout(user.id, target.rolloutPercentage);
      }
    }

    return false;
  }

  // Check if user matches segment criteria
  private doesUserMatchSegment(user: User, criteria: any): boolean {
    // Role matching
    if (criteria.role && !criteria.role.includes(user.role)) {
      return false;
    }

    // Registration date matching
    if (criteria.registrationDateAfter && user.registrationDate) {
      if (user.registrationDate < new Date(criteria.registrationDateAfter)) {
        return false;
      }
    }

    if (criteria.registrationDateBefore && user.registrationDate) {
      if (user.registrationDate > new Date(criteria.registrationDateBefore)) {
        return false;
      }
    }

    // Custom rules
    if (criteria.customRules) {
      for (const rule of criteria.customRules) {
        if (!this.evaluateCustomRule(user, rule)) {
          return false;
        }
      }
    }

    return true;
  }

  // Evaluate custom rule
  private evaluateCustomRule(user: User, rule: any): boolean {
    const userValue = user.metadata?.[rule.field];
    
    switch (rule.operator) {
      case 'equals':
        return userValue === rule.value;
      case 'not_equals':
        return userValue !== rule.value;
      case 'contains':
        return typeof userValue === 'string' && userValue.includes(rule.value);
      case 'greater_than':
        return typeof userValue === 'number' && userValue > rule.value;
      case 'less_than':
        return typeof userValue === 'number' && userValue < rule.value;
      default:
        return false;
    }
  }

  // Gradual rollout based on time stages
  private async isUserInGradualRollout(user: User, featureFlag: FeatureFlag): Promise<boolean> {
    // This would typically be configured in database or external config
    // For demo purposes, using a simple time-based gradual rollout
    
    const rolloutStartTime = featureFlag.createdAt.getTime();
    const currentTime = Date.now();
    const timeSinceStart = currentTime - rolloutStartTime;
    
    // Gradual rollout over 7 days
    const rolloutDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    const progressRatio = Math.min(timeSinceStart / rolloutDuration, 1);
    const currentPercentage = Math.floor(progressRatio * featureFlag.rolloutPercentage);
    
    return this.isUserInPercentageRollout(user.id, currentPercentage);
  }

  // Create rollout plan
  async createRolloutPlan(featureName: string, stages: RolloutStage[]): Promise<RolloutPlan> {
    const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);
    
    const plan: RolloutPlan = {
      featureName,
      stages,
      currentStage: 0,
      totalDuration
    };

    // Set start times for each stage
    let currentTime = Date.now();
    for (let i = 0; i < stages.length; i++) {
      stages[i].startTime = new Date(currentTime);
      stages[i].endTime = new Date(currentTime + stages[i].duration);
      currentTime += stages[i].duration;
    }

    return plan;
  }

  // Execute gradual rollout
  async executeGradualRollout(plan: RolloutPlan): Promise<void> {
    console.log(`🚀 Starting gradual rollout for '${plan.featureName}'`);
    
    for (let i = 0; i < plan.stages.length; i++) {
      const stage = plan.stages[i];
      
      console.log(`📈 Stage ${stage.stage}: Rolling out to ${stage.percentage}% of users`);
      
      // Update feature flag percentage
      await this.featureFlagRepo.updateRolloutPercentage(
        plan.featureName, 
        stage.percentage,
        'gradual_rollout_system'
      );

      // Clear cache to pick up new percentage
      this.clearCache(plan.featureName);
      
      // Wait for stage duration (in real implementation, this would be scheduled)
      if (i < plan.stages.length - 1) {
        console.log(`⏳ Waiting ${stage.duration / 1000} seconds for next stage...`);
        await this.sleep(stage.duration);
      }
    }
    
    console.log(`✅ Gradual rollout completed for '${plan.featureName}'`);
  }

  // Record analytics
  private async recordAnalytics(
    featureFlagId: number, 
    userId: string, 
    eventType: string, 
    eventData?: Record<string, any>
  ): Promise<void> {
    if (process.env.ENABLE_FEATURE_ANALYTICS === 'true') {
      try {
        await this.featureFlagRepo.recordFeatureAnalytics(featureFlagId, userId, eventType, eventData);
      } catch (error) {
        console.error('Failed to record feature analytics:', error);
      }
    }
  }

  // Get feature analytics
  async getFeatureAnalytics(featureName: string, days: number = 7): Promise<any> {
    const featureFlag = await this.getFeatureFlag(featureName, 'production');
    if (!featureFlag) {
      throw new Error(`Feature flag '${featureName}' not found`);
    }

    const analytics = await this.featureFlagRepo.getFeatureAnalytics(featureFlag.id, days);
    
    // Process analytics data
    const summary = {
      totalUsers: new Set(analytics.map(a => a.user_id)).size,
      enabledCount: analytics.filter(a => a.event_type === 'enabled').length,
      disabledCount: analytics.filter(a => a.event_type === 'disabled').length,
      usageCount: analytics.filter(a => a.event_type === 'used').length,
      dailyBreakdown: this.groupAnalyticsByDate(analytics)
    };

    return summary;
  }

  // Group analytics by date
  private groupAnalyticsByDate(analytics: any[]): Record<string, any> {
    const grouped: Record<string, any> = {};
    
    analytics.forEach(item => {
      const date = item.date;
      if (!grouped[date]) {
        grouped[date] = { enabled: 0, disabled: 0, used: 0 };
      }
      grouped[date][item.event_type] = parseInt(item.count);
    });

    return grouped;
  }

  // Utility methods
  private async refreshCache(): Promise<void> {
    console.log('🔄 Refreshing feature flag cache...');
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  private clearCache(featureName?: string): void {
    if (featureName) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(featureName));
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      });
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}