import express from 'express'
import dotenv from 'dotenv'
import { featureToggleRoutes } from './routes/feature-toggle.routes'
import { requireFeature } from './middleware/feature-toggle.middleware'

const app = express()
app.use(express.json())

dotenv.config()

// Feature toggle management routes
app.use('/api/admin', featureToggleRoutes)

// Example protected routes using feature toggles
app.post('/api/register', requireFeature('user-registration'), (req, res) => {
  res.json({ message: 'User registration endpoint' })
})

app.post('/api/payment', requireFeature('payment-gateway'), (req, res) => {
  res.json({ message: 'Payment processing endpoint' })
})

app.get('/api/beta/new-feature', requireFeature('beta-features'), (req, res) => {
  res.json({ message: 'Beta feature endpoint' })
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default app
