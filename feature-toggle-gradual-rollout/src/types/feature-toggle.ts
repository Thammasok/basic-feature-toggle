export interface User {
  id: string;
  email: string;
  role: string;
  segment?: string;
  registrationDate?: Date;
  metadata?: Record<string, any>;
}

export interface FeatureFlag {
  id: number;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  rolloutStrategy: 'percentage' | 'segment' | 'user_list' | 'gradual';
  environment: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface UserSegment {
  id: number;
  name: string;
  description?: string;
  criteria: SegmentCriteria;
  createdAt: Date;
}

export interface SegmentCriteria {
  role?: string[];
  registrationDateAfter?: Date;
  registrationDateBefore?: Date;
  metadata?: Record<string, any>;
  customRules?: CustomRule[];
}

export interface CustomRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface FeatureTargeting {
  id: number;
  featureFlagId: number;
  segmentId: number;
  enabled: boolean;
  rolloutPercentage: number;
  createdAt: Date;
}

export interface UserFeatureAssignment {
  id: number;
  userId: string;
  featureFlagId: number;
  assigned: boolean;
  assignedAt: Date;
  assignmentReason: string;
}

export interface FeatureAnalytics {
  featureFlagId: number;
  userId: string;
  eventType: 'enabled' | 'disabled' | 'used';
  eventData?: Record<string, any>;
  timestamp: Date;
}

export interface RolloutPlan {
  featureName: string;
  stages: RolloutStage[];
  currentStage: number;
  totalDuration: number;
}

export interface RolloutStage {
  stage: number;
  percentage: number;
  duration: number; // in milliseconds
  criteria?: string;
  startTime?: Date;
  endTime?: Date;
}