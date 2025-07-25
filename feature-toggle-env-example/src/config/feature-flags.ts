import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface FeatureFlags {
  // Database Features
  enableNewDatabase: boolean;
  enableDatabaseMigration: boolean;
  enableDatabaseBackup: boolean;

  // Authentication Features
  enableTwoFactorAuth: boolean;
  enableOauthLogin: boolean;
  enablePasswordReset: boolean;

  // UI Features
  enableNewDashboard: boolean;
  enableDarkMode: boolean;
  enableBetaFeatures: boolean;

  // Payment Features
  enablePaymentV2: boolean;
  enableSubscriptionBilling: boolean;
  enableCryptoPayments: boolean;

  // Analytics & Monitoring
  enableAnalytics: boolean;
  enableErrorTracking: boolean;
  enablePerformanceMonitoring: boolean;

  // External Services
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;
  enablePushNotifications: boolean;

  // Debug & Development
  enableDebugMode: boolean;
  enableApiLogging: boolean;
  enableMockData: boolean;
}

// Helper function to parse boolean from environment variable
function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (value === undefined) return defaultValue;

  const normalizedValue = value.toLowerCase().trim();
  return normalizedValue === 'true' || normalizedValue === '1' || normalizedValue === 'yes';
}

// Create feature flags object from environment variables
export const featureFlags: FeatureFlags = {
  // Database Features
  enableNewDatabase: parseBoolean(process.env.ENABLE_NEW_DATABASE),
  enableDatabaseMigration: parseBoolean(process.env.ENABLE_DATABASE_MIGRATION),
  enableDatabaseBackup: parseBoolean(process.env.ENABLE_DATABASE_BACKUP),

  // Authentication Features
  enableTwoFactorAuth: parseBoolean(process.env.ENABLE_TWO_FACTOR_AUTH),
  enableOauthLogin: parseBoolean(process.env.ENABLE_OAUTH_LOGIN),
  enablePasswordReset: parseBoolean(process.env.ENABLE_PASSWORD_RESET),

  // UI Features
  enableNewDashboard: parseBoolean(process.env.ENABLE_NEW_DASHBOARD),
  enableDarkMode: parseBoolean(process.env.ENABLE_DARK_MODE),
  enableBetaFeatures: parseBoolean(process.env.ENABLE_BETA_FEATURES),

  // Payment Features
  enablePaymentV2: parseBoolean(process.env.ENABLE_PAYMENT_V2),
  enableSubscriptionBilling: parseBoolean(process.env.ENABLE_SUBSCRIPTION_BILLING),
  enableCryptoPayments: parseBoolean(process.env.ENABLE_CRYPTO_PAYMENTS),

  // Analytics & Monitoring
  enableAnalytics: parseBoolean(process.env.ENABLE_ANALYTICS),
  enableErrorTracking: parseBoolean(process.env.ENABLE_ERROR_TRACKING),
  enablePerformanceMonitoring: parseBoolean(process.env.ENABLE_PERFORMANCE_MONITORING),

  // External Services
  enableEmailNotifications: parseBoolean(process.env.ENABLE_EMAIL_NOTIFICATIONS),
  enableSmsNotifications: parseBoolean(process.env.ENABLE_SMS_NOTIFICATIONS),
  enablePushNotifications: parseBoolean(process.env.ENABLE_PUSH_NOTIFICATIONS),

  // Debug & Development
  enableDebugMode: parseBoolean(process.env.ENABLE_DEBUG_MODE),
  enableApiLogging: parseBoolean(process.env.ENABLE_API_LOGGING),
  enableMockData: parseBoolean(process.env.ENABLE_MOCK_DATA)
};