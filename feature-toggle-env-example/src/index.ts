import express from 'express';
import { DatabaseService } from './services/database.service';
import { AuthService } from './services/auth.service';
import { NotificationService } from './services/notification.service';
import { DashboardController } from './controllers/dashboard.controller';
import { loggingMiddleware } from './middleware/logging.middleware';
import { FeatureToggle } from './feature-toggle';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(loggingMiddleware);

// Initialize services
const dbService = new DatabaseService();
const authService = new AuthService();
const notificationService = new NotificationService();

// Routes
app.get('/dashboard', DashboardController.getDashboard);

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const isAuthenticated = await authService.authenticate(username, password);

  res.json({ success: isAuthenticated });
});

app.post('/auth/reset-password', async (req, res) => {
  const { email } = req.body;
  const success = await authService.resetPassword(email);

  res.json({ success });
});

app.post('/auth/oauth/:provider', async (req, res) => {
  const { provider } = req.params;
  const success = await authService.oauthLogin(provider);

  res.json({ success });
});

app.post('/notifications', async (req, res) => {
  const { message, userId } = req.body;
  await notificationService.sendNotification(message, userId);

  res.json({ success: true });
});

app.get('/feature-flags', (req, res) => {
  res.json({
    flags: FeatureToggle.getEnabledFeatures(),
    summary: FeatureToggle.getSummary()
  });
});

app.get('/health', (req, res) => {
  const configValidation = FeatureToggle.validateConfig();

  res.json({
    status: 'ok',
    features: FeatureToggle.getSummary(),
    config: configValidation
  });
});

// Initialize application
async function initializeApp(): Promise<void> {
  try {
    // Validate configuration
    const configValidation = FeatureToggle.validateConfig();
    if (!configValidation.valid) {
      console.warn('⚠️  Missing environment variables:', configValidation.missingVars);
    }

    // Log current configuration
    FeatureToggle.logConfiguration();

    // Initialize database
    await dbService.connect();
    await dbService.migrate();
    await dbService.backup();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Features enabled: ${FeatureToggle.getEnabledFeatures().length}`);

      if (FeatureToggle.isEnabled('enableDebugMode')) {
        console.log('🐛 Debug mode is ON');
      }
    });

  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// Start the application
initializeApp();