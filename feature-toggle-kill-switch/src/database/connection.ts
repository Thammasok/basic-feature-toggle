import { Pool, PoolConfig } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const poolConfig: PoolConfig = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

export const pool = new Pool(poolConfig)

// Test connection
pool.on('connect', () => {
  console.log('🔗 Connected to PostgreSQL database')
})

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Closing database connections...')
  await pool.end()
  process.exit(0)
})
