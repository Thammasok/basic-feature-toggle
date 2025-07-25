import express from 'express';
import dotenv from 'dotenv';
import featureToggleRoutes from './routes/feature-toggle.routes';
import { extractUserMiddleware } from './middleware/user.middleware';
import { pool } from './database/connection';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(extractUserMiddleware);

// Routes
app.use('/api/feature-toggle', featureToggleRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Example usage endpoint
app.get('/dashboard', async (req, res) => {
  try {
    const user = (req as any).user;

    // Check multiple features
    const response = await fetch(`http://localhost:${PORT}/api/feature-toggle/features/new_dashboard/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
        'x-user-role': user.role,
        'x-beta-tester': user.metadata.beta_tester.toString()
      },
      body: JSON.stringify({ user })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    type FeatureCheckResponse = {
      feature: string
      enabled: boolean
      user: string
      timestamp: string
    }

    const featureCheck = await response.json() as FeatureCheckResponse;

    res.json({
      message: 'Dashboard loaded',
      user: user.id,
      features: {
        newDashboard: featureCheck.enabled
      },
      dashboard: featureCheck.enabled ? 'modern' : 'classic'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load dashboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Gradual Rollout Feature Toggle Server');
  console.log('=====================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_NAME}`);
  console.log(`🔄 Cache TTL: ${process.env.FEATURE_CACHE_TTL}ms`);
  console.log(`⏱️  Rollout Update Interval: ${process.env.ROLLOUT_UPDATE_INTERVAL}ms`);
  console.log('=====================================');

  console.log('\n📚 Available Endpoints:');
  console.log('GET    /health - Health check');
  console.log('GET    /dashboard - Example dashboard with feature toggle');
  console.log('GET    /api/feature-toggle/features - List all features');
  console.log('POST   /api/feature-toggle/features - Create/update feature');
  console.log('POST   /api/feature-toggle/features/:name/check - Check feature for user');
  console.log('PUT    /api/feature-toggle/features/:name/rollout - Update rollout percentage');
  console.log('POST   /api/feature-toggle/features/:name/gradual-rollout - Start gradual rollout');
  console.log('GET    /api/feature-toggle/features/:name/analytics - Get feature analytics');
  console.log('GET    /api/feature-toggle/segments - List user segments');

  console.log('\n🧪 Example curl commands:');
  console.log(`curl -X POST http://localhost:${PORT}/api/feature-toggle/features/new_dashboard/check \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -H "x-user-id: user123" \\');
  console.log('  -H "x-user-role: premium" \\');
  console.log('  -d \'{"user":{"id":"user123","role":"premium"}}\'');
  console.log('');
  console.log(`curl -X PUT http://localhost:${PORT}/api/feature-toggle/features/new_dashboard/rollout \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"percentage": 50}\'');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await pool.end();
  process.exit(0);
});
